/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React from 'react'
import { Page, Navbar, NavLeft, Block, BlockTitle, ListInput, List, Chip, ListItem, AccordionContent, Link, Icon, Button } from 'framework7-react'

import * as Scroll from 'react-scroll'

import ReactPlayer from 'react-player'

import DatabaseRequest from "../frameworks/DatabaseRequest"
import VideoUtils from '../utils/VideoUtils'
import JSUtils from '../utils/JSUtils'

export default class QuizEditPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      content: null,
      progress: null,
      quiz: null
    }
    this.saveTimeout = null;
    this.player = null
    this.pausedToAskAQuestion = false
    this.pausedAtSeconds = false
    this.type = {
      singleChoice: "Single Choice",
      multipleChoice: "Multiple Choice",
      openEnded: "Open-ended",
      typeToMatch: "Type to Match",
      trueFalse: "True or False",
      annotationOnVideo: "Annotation on Video",
      noAnswerRequired: "No Answer Required"
    }
    this.pauseToAskQuestion = this.pauseToAskQuestion.bind(this)
    this.askQuestion = this.askQuestion.bind(this)
    this.resetAskQuestion = this.resetAskQuestion.bind(this)
    this.seekToQuestion = this.seekToQuestion.bind(this)
    this.addAnswerToQuestion = this.addAnswerToQuestion.bind(this)
    this.removeAnswerToQuestionAtIndex = this.removeAnswerToQuestionAtIndex.bind(this)
  }

  async componentDidMount() {
    if (this.props.contentId) {
      const content = await DatabaseRequest.FetchObjects({
        class: "Content",
        equalTo: {
          objectId: this.props.contentId
        },
        include: ["collection"],
        limit: 1
      })
      if (content) {
        const topCollection = DatabaseRequest.GetValue(DatabaseRequest.GetValue(content, "collection"), "topCollection")
        if (topCollection) {
          const canWrite = await DatabaseRequest.FetchObjects({
            class: "Role",
            equalTo: {
              name: "admins-" + DatabaseRequest.GetId(topCollection),
              users: DatabaseRequest.GetPointerById("User", DatabaseRequest.GetId(DatabaseRequest.GetCurrentUser()))
            },
            select: ["objectId"],
            limit: 1
          })
          if (canWrite) {
            //document.title = await DatabaseRequest.GetValue(content, "title")
            var quiz = await DatabaseRequest.FetchObjects({
              class: "QuizQuestions",
              equalTo: {
                content: content
              },
              notEqualTo: {
                deleted: true
              },
              ascending: "timestamp",
              limit: 1000
            })
            this.setState({ content:content, quiz:quiz })
          }
        }
      }
    }
  }

  trackProgress(progress) {
    if (!progress.played) {
      return
    }
    this.pausedAtSeconds = progress.playedSeconds
    if (this.pausedToAskAQuestion) {
      this.pausedToAskAQuestion = false
      this.askQuestion()
    }
    var seconds = progress.playedSeconds
    this.setState({ progress:JSUtils.FormatTimestamp(seconds) })

    var scroll = Scroll.animateScroll
    //console.log(scroll)
    scroll.scrollToBottom({
      smooth: true,
      duration: 500
    })
  }

  pauseToAskQuestion() {
    var player = null
    try {
      if (this.player.player.player) {
        player = this.player.player
        if (!this.state.progress)
          player.player.play()
        else if (player.isPlaying) {
          this.pausedToAskAQuestion = true
          player.player.pause()
        }
        else
          this.askQuestion()
      }
    }
    catch(e) {
      if (this.player.getInternalPlayer()) {
        player = this.player.getInternalPlayer() 
        if (!this.state.progress)
          player.playVideo()
        else if (player.isPlaying()) {
          this.pausedToAskAQuestion = true
          player.pauseVideo()
        }
        else
          this.askQuestion()
      }
    }
  }

  askQuestion() {
    const quiz = this.state.quiz
    var question = this.getQuestionAtTimestamp(this.pausedAtSeconds)
    if (question || !this.state.content) {
      return
    }
    const topCollectionId = DatabaseRequest.GetId(DatabaseRequest.GetValue(DatabaseRequest.GetValue(this.state.content, "collection"), "topCollection"))
    question = DatabaseRequest.CreateObject({
      class: "QuizQuestions",
      set: {
        timestamp: this.pausedAtSeconds,
        content: this.state.content,
        user: DatabaseRequest.GetCurrentUser()
      },
      acl: {
        publicRead: DatabaseRequest.HasPublicReadAccess(this.state.content),
        publicWrite: false,
        roleReadAccess: [
          "guests-" + topCollectionId,
          "admins-" + topCollectionId
        ],
        roleWriteAccess: [
          "admins-" + topCollectionId
        ]
      }
    })
    quiz.push(question)
    quiz.sort(function(a, b){
      return DatabaseRequest.GetValue(a, "timestamp") - DatabaseRequest.GetValue(b, "timestamp")
    })
    this.setState({ quiz:quiz })
  }

  seekToQuestion(timestamp) {
    var player = null
    try {
      if (this.player.player.player) {
        player = this.player.player.player
        player.pause()
        player.seekTo(timestamp, "seconds")
      }
    } catch(e) {}
  }

  setTypeForQuestion(timestamp, type) {
    const quiz = this.state.quiz
    const question = this.getQuestionAtTimestamp(timestamp)
    DatabaseRequest.SetValue(question, "type", type)
    if (type == 'singleChoice' || type == 'multipleChoice') {
      const answers = [
        { answer:"", correct:false }
      ]
      DatabaseRequest.SetValue(question, "answers", answers)
    }
    else if (type == 'trueFalse') {
      const answers = [
        { answer:"True", correct:true },
        { answer:"False", correct:false }
      ]
      DatabaseRequest.SetValue(question, "answers", answers)
    }
    else if (type == 'typeToMatch') {
      const answers = [
        { answer:"", correct:true }
      ]
      DatabaseRequest.SetValue(question, "answers", answers)
    }
    else {
      DatabaseRequest.UnsetValue(question, "answers")
    }
    this.setState({ quiz:quiz })
    this.saveQuestion(question)
  }

  addAnswerToQuestion(timestamp) {
    const quiz = this.state.quiz
    const question = this.getQuestionAtTimestamp(timestamp)
    var answers = this.getAnswersForQuestion(question)
    if (!answers) answers = []
    answers = answers.concat({ answer:"", correct:false })
    DatabaseRequest.SetValue(question, "answers", answers)
    this.setState({ quiz:quiz })
    this.saveQuestion(question)
  }

  removeAnswerToQuestionAtIndex(timestamp, index) {
    const quiz = this.state.quiz
    const question = this.getQuestionAtTimestamp(timestamp)
    var answers = this.getAnswersForQuestion(question)
    let app = this.$f7;
    app.dialog.prompt(DatabaseRequest.GetValue(question, "question") + "<br /><br />" + answers[index].answer, "Remove this answer?", () => {
      DatabaseRequest.SetValue(question, "answers", [])
      this.setState({ quiz:quiz })
      answers = answers.filter((item, j) => index !== j)
      if (answers.length) {
        DatabaseRequest.SetValue(question, "answers", answers)
      }
      else {
        this.resetQuestionType()
      }
      this.setState({ quiz:quiz })
      this.saveQuestion(question)
    })
  }

  resetQuestionType(timestamp) {
    const quiz = this.state.quiz
    const question = this.getQuestionAtTimestamp(timestamp)
    let app = this.$f7;
    app.dialog.prompt(DatabaseRequest.GetValue(question, "question") + "<br /><br />" + this.type[DatabaseRequest.GetValue(question, "type")], "Change answer type?", () => {
      DatabaseRequest.UnsetValue(question, "type")
      DatabaseRequest.UnsetValue(question, "answers")
      this.setState({ quiz:quiz })
      this.saveQuestion(question)
    })
  }

  toggleCorrectAnswerToQuestionAtIndex(timestamp, index) {
    const quiz = this.state.quiz
    const question = this.getQuestionAtTimestamp(timestamp)
    var answers = this.getAnswersForQuestion(question)
    if (DatabaseRequest.GetValue(question, "type") == "singleChoice" || DatabaseRequest.GetValue(question, "type") == "trueFalse") {
      answers = answers.map(o => {
        o.correct = false
        return o
      })
    }
    answers[index].correct = !answers[index].correct
    DatabaseRequest.SetValue(question, "answers", answers)
    this.setState({ quiz:quiz })
    this.saveQuestion(question)
  }

  editQuestionAtTimestamp(timestamp, newValue) {
    const question = this.getQuestionAtTimestamp(timestamp)
    DatabaseRequest.SetValue(question, "question", newValue)
    this.saveQuestion(question)
  }

  deleteQuestionAtTimestamp(timestamp) {
    const quiz = this.state.quiz
    const question = this.getQuestionAtTimestamp(timestamp)
    let app = this.$f7;
    app.dialog.prompt(DatabaseRequest.GetValue(question, "question"), "Delete this question?", () => {
      DatabaseRequest.SetValue(question, "deleted", true)
      this.setState({ quiz:quiz })
      this.saveQuestion(question)
      DatabaseRequest.LogUserAction({
        "action": "removeQuizQuestion",
        "collection": DatabaseRequest.GetValue(this.state.content, "collection"),
        "content": this.state.content,
        "question": question
      })
    })
  }

  editAnswerToQuestionAtIndex(timestamp, index, newValue) {
    const question = this.getQuestionAtTimestamp(timestamp)
    var answers = this.getAnswersForQuestion(question)
    answers[index].answer = newValue
    DatabaseRequest.SetValue(question, "answers", answers)
    this.saveQuestion(question)
  }

  reorderAnswerToQuestionDragFromDropTo(timestamp, fromIndex, toIndex) {
    const quiz = this.state.quiz
    const question = this.getQuestionAtTimestamp(timestamp)
    var answers = this.getAnswersForQuestion(question)
    const movedItem = answers.find((item, index) => index === fromIndex)
    const remainingItems = answers.filter((item, index) => index !== fromIndex)
    DatabaseRequest.SetValue(question, "answers", [])
    this.setState({ quiz:quiz })
    answers = [
      ...remainingItems.slice(0, toIndex),
      movedItem,
      ...remainingItems.slice(toIndex)
    ];
    DatabaseRequest.SetValue(question, "answers", answers)
    this.setState({ quiz:quiz })
    this.saveQuestion(question)
  }

  getQuestionAtTimestamp(timestamp) {
    if (!timestamp) return
    const quiz = this.state.quiz
    if (!quiz) return
    const question = quiz.find(obj => DatabaseRequest.GetValue(obj, "timestamp") === timestamp)
    if (!question) return
    return question
  }

  getAnswersForQuestion(question) {
    if (!question) return
    var answers = DatabaseRequest.GetValue(question, "answers")
    if (!answers) return
    return answers
  }

  async addQuizPreference(preference) {
    if (!this.state.content) return
    if (!preference) return
    if (preference === 'accessiblewithlink') {
      var contentACL = DatabaseRequest.GetACL(this.state.content)
      DatabaseRequest.SetPublicReadAccess(contentACL, true)
      DatabaseRequest.SetACL(this.state.content, contentACL)
      this.updateQuestionsACL(contentACL)
    }
    DatabaseRequest.AddUniqueValueToArray(this.state.content, "quizPreferences", preference)
    await DatabaseRequest.SaveObject(this.state.content)
    DatabaseRequest.LogUserAction({
      "action": "addQuizPreference",
      "preference": preference,
      "collection": DatabaseRequest.GetValue(this.state.content, "collection"),
      "content": this.state.content
    })
  }

  async removeQuizPreference(preference) {
    if (!this.state.content) return
    if (!preference) return
    if (preference === 'accessiblewithlink') {
      var contentACL = DatabaseRequest.GetACL(this.state.content)
      DatabaseRequest.SetPublicReadAccess(contentACL, false)
      DatabaseRequest.SetACL(this.state.content, contentACL)
      this.updateQuestionsACL(contentACL)
    }
    DatabaseRequest.RemoveValueFromArray(this.state.content, "quizPreferences", preference)
    await DatabaseRequest.SaveObject(this.state.content)
    DatabaseRequest.LogUserAction({
      "action": "removeQuizPreference",
      "preference": preference,
      "collection": DatabaseRequest.GetValue(this.state.content, "collection"),
      "content": this.state.content
    })
  }

  updateQuestionsACL(contentACL) {
    // TODO: make it a cloud/server function
    const _this = this
    this.state.quiz.map((question) => {
      DatabaseRequest.SetACL(question, contentACL)
      _this.saveQuestionExecute(question, false)
    })
  }

  saveQuestion(question, delay=true) {
    const self = this
    clearTimeout(this.timeout)
    if (delay) {
      this.timeout = setTimeout(async function () {
        self.saveQuestionExecute(question)
      }, 1000)
    }
    else {
      self.saveQuestionExecute(question)
    }
  }
  async saveQuestionExecute(question) {
    if (question) {
      await DatabaseRequest.SaveObject(question)
      if (!DatabaseRequest.GetValue(this.state.content, "quizPreferences")) {
        DatabaseRequest.SetValue(this.state.content, "quizPreferences", [])
        await DatabaseRequest.SaveObject(this.state.content)
      }
      DatabaseRequest.LogUserAction({
        "action": "addQuizQuestion",
        "collection": DatabaseRequest.GetValue(this.state.content, "collection"),
        "content": this.state.content,
        "question": question
      })
    }
  }

  resetAskQuestion() {
    this.pausedToAskAQuestion = false
  }

  render() {

    const topCollection = DatabaseRequest.GetValue(DatabaseRequest.GetValue(this.state.content, "collection"), "topCollection")

    var quizPreferences = DatabaseRequest.GetValue(this.state.content, "quizPreferences") || []

    const videoUrl = VideoUtils.GetVideoUrlFromContent(this.state.content) || null
    
    return (
      <Page colorTheme="deeppurple" style={{ backgroundColor:"#171717" }}>
        <Navbar bgColor="black" size="30" themeDark={ true }>
          <NavLeft colorTheme="black" style={{ width:"40px", height:"32px" }}>
            <Link back colorTheme="white" animate={DatabaseRequest.GetCurrentUser() ? !DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "accessibilityReduceMotion") : false}>
              <Icon f7="arrow_left" className="margin-right"></Icon>
              <img alt="" src="./img/look-education-sticker.png" height="24" />
            </Link>
          </NavLeft>
        </Navbar>

        { videoUrl &&
        <div className="row">
          <div tabletWidth="50" desktopWidth="50" className="col-100 elevation-10 margin-bottom sticky">

            <ReactPlayer url={ videoUrl } playsinline controls width="100%" className="video-quiz"
              ref={player => this.player = player}
              onDuration = { (duration) => {
                /* if (this.state.content && duration) {
                  this.updateDurationIfNeeded(duration)
                }
                else if (this.contentAnalytics && duration) {
                  this.updateDurationIfNeeded(duration)
                } */
              }}
              onProgress = { (progress) => {
                this.trackProgress(progress)
              }}
              onPause = { () => {
                
              }}
              onPlay = { () => {
                this.resetAskQuestion()
              }}
              onSeek = { () => {
                this.resetAskQuestion()
              }}
              onEnded = { () => {
                this.resetAskQuestion()
              }}
            />

            <br />

            <Button fill large onClick={ this.pauseToAskQuestion }>{ this.state.progress ? ('Ask A Question At ' + this.state.progress) : 'Play Video' }</Button>

          </div>

          <div tabletWidth="50" desktopWidth="50" bgColor="white" textColor="black" className="col-100 padding">

            <h3 className="no-margin-top">{ DatabaseRequest.GetValue(this.state.content, "title") }</h3>

            { this.state.quiz &&
              <List accordionList className="no-margin-top">
                <ListItem accordionItem title="Quiz Preferences...">
                  <AccordionContent bgColor="gray">
                    <BlockTitle textColor="white">ACCESS RULES</BlockTitle>
                    <List inset>
                      <ListItem radio defaultChecked={ !quizPreferences.includes("accessiblewithlink") } name="checkbox-access" title={ "Accessible privately to subscribers" }
                        onChange={ (event) => { if (event.target.checked) this.removeQuizPreference("accessiblewithlink") } }
                      >
                        <Link slot="after" href={ "/subscribers/" + DatabaseRequest.GetId(topCollection) }>{ "[ " + (DatabaseRequest.GetValue(topCollection, "subscribersCount") || "0") + " ]" }</Link>
                      </ListItem>
                      <ListItem radio defaultChecked={ quizPreferences.includes("accessiblewithlink") } name="checkbox-access" title={ "Accessible to anyone with a link" }
                        onChange={ (event) => { if (event.target.checked) this.addQuizPreference("accessiblewithlink") } }
                      >
                        <Link external target="_blank" slot="after" href={ "/quiz/" + DatabaseRequest.GetId(this.state.content) }>[ public link ]</Link>
                      </ListItem>
                      <ListItem checkbox defaultChecked={ quizPreferences.includes("mandatory") } name="checkbox-mandatory" title={ "Quiz is mandatory" }
                        onChange={ (event) => event.target.checked ? this.addQuizPreference("mandatory") : this.removeQuizPreference("mandatory") }
                      />
                    </List>
                    <BlockTitle textColor="white">QUESTIONS RULES</BlockTitle>
                    <List inset>
                      <ListItem radio defaultChecked={ quizPreferences.includes("preview") } name="radio-preview" title={ "Respondents can preview all questions" }
                        onChange={ () => this.addQuizPreference("preview") }
                      />
                      <ListItem radio defaultChecked={ !quizPreferences.includes("preview") } name="radio-preview" title={ "Respondents only see one question at a time" }
                        onChange={ () => this.removeQuizPreference("preview") }
                      />
                    </List>
                    <BlockTitle textColor="white">ANSWERS RULES</BlockTitle>
                    <List inset>
                      <ListItem checkbox defaultChecked={ quizPreferences.includes("feedback") } name="checkbox-feedback" title={ "Reveal correct answer after submit" }
                        onChange={ (event) => event.target.checked ? this.addQuizPreference("feedback") : this.removeQuizPreference("feedback") }
                      />
                      <ListItem checkbox defaultChecked={ quizPreferences.includes("skip") } name="checkbox-skip" title={ "Respondents may skip any question" }
                        onChange={ (event) => event.target.checked ? this.addQuizPreference("skip") : this.removeQuizPreference("skip") }
                      />
                    </List>
                    <br />
                  </AccordionContent>
                  <Icon slot="media" f7="gear_fill"/>
                </ListItem>
              </List>
            }

            { this.state.quiz && this.state.quiz.map((question) =>
              <div key={ DatabaseRequest.GetValue(question, "timestamp") } onClick={ () => this.seekToQuestion(DatabaseRequest.GetValue(question, "timestamp")) }>
              { !DatabaseRequest.GetValue(question, "deleted") &&
                <Block className="no-padding-horizontal">
                  <Link noLinkClass bgColor="deeppurple" textColor="white" className="elevation-1 elevation-hover-3 elevation-transition no-padding-vertical padding-horizontal">{ JSUtils.FormatTimestamp(DatabaseRequest.GetValue(question, "timestamp"), "milliseconds") }</Link>
                  <List className="no-margin" noHairlines>
                    <ListInput
                      className="no-padding"
                      colorTheme="black"
                      type="textarea"
                      resizable
                      required
                      autofocus={ DatabaseRequest.GetValue(question, "question") ? false : true }
                      placeholder="Ask a question..."
                      defaultValue={ DatabaseRequest.GetValue(question, "question") }
                      onInput = { (event) => {
                        this.editQuestionAtTimestamp(DatabaseRequest.GetValue(question, "timestamp"), event.target.value)
                      }}
                    >
                      <Link noLinkClass slot="media" onClick={ () => this.deleteQuestionAtTimestamp(DatabaseRequest.GetValue(question, "timestamp")) } style={{ position:"absolute", top:15 }}><Icon f7="close_round"/></Link>
                    </ListInput>

                    { !DatabaseRequest.GetValue(question, "type") &&
                      <Block className="margin-left no-margin-vertical" textColor="gray">
                        What kind of answer do you expect?
                        <br />
                        <Chip className="elevation-hover-1 elevation-transition margin-right" text={ this.type.singleChoice } mediaBgColor="gray" onClick={ () => this.setTypeForQuestion(DatabaseRequest.GetValue(question, "timestamp"), "singleChoice") } style={{ cursor:"pointer" }}></Chip>
                        <Chip className="elevation-hover-1 elevation-transition margin-right" text={ this.type.multipleChoice } mediaBgColor="gray" onClick={ () => this.setTypeForQuestion(DatabaseRequest.GetValue(question, "timestamp"), "multipleChoice") } style={{ cursor:"pointer" }}></Chip>
                        <Chip className="elevation-hover-1 elevation-transition margin-right" text={ this.type.openEnded } mediaBgColor="gray" onClick={ () => this.setTypeForQuestion(DatabaseRequest.GetValue(question, "timestamp"), "openEnded") } style={{ cursor:"pointer" }}></Chip>
                        <Chip className="elevation-hover-1 elevation-transition margin-right" text={ this.type.typeToMatch } mediaBgColor="gray" onClick={ () => this.setTypeForQuestion(DatabaseRequest.GetValue(question, "timestamp"), "typeToMatch") } style={{ cursor:"pointer" }}></Chip>
                        <Chip className="elevation-hover-1 elevation-transition margin-right" text={ this.type.trueFalse } mediaBgColor="gray" onClick={ () => this.setTypeForQuestion(DatabaseRequest.GetValue(question, "timestamp"), "trueFalse") } style={{ cursor:"pointer" }}></Chip>
                        <Chip className="elevation-hover-1 elevation-transition margin-right" text={ this.type.annotationOnVideo } mediaBgColor="gray" onClick={ () => this.setTypeForQuestion(DatabaseRequest.GetValue(question, "timestamp"), "annotationOnVideo") } style={{ cursor:"pointer" }}></Chip>
                        <Chip className="elevation-hover-1 elevation-transition margin-right" text={ this.type.noAnswerRequired } mediaBgColor="gray" onClick={ () => this.setTypeForQuestion(DatabaseRequest.GetValue(question, "timestamp"), "noAnswerRequired") } style={{ cursor:"pointer" }}></Chip>
                      </Block>
                    }

                    { DatabaseRequest.GetValue(question, "type") &&
                      <Block className="margin-left no-margin-vertical" textColor="gray">
                        <b>{ this.type[DatabaseRequest.GetValue(question, "type")] }</b>
                        <Link noLinkClass className="margin-left" onClick={ () => this.resetQuestionType(DatabaseRequest.GetValue(question, "timestamp")) }><Icon f7="close_round" size="14" color="gray"/></Link>
                        <br />
                        { DatabaseRequest.GetValue(question, "type") == "openEnded" &&
                          <List className="no-margin-vertical">
                            <ListInput
                              className="no-padding elevation-3"
                              colorTheme="black"
                              type="textarea"
                              disabled
                              value="The respondent will enter a open-ended text or essay. The answer cannot be evaluated automatically."
                            />
                          </List>
                        }
                        { DatabaseRequest.GetValue(question, "answers") &&
                          <>
                          { (DatabaseRequest.GetValue(question, "type") == "singleChoice" || DatabaseRequest.GetValue(question, "type") == "multipleChoice" || DatabaseRequest.GetValue(question, "type") == "trueFalse") &&
                            <>
                            Edit and shuffle possible expected answers:
                            </>
                          }
                          { DatabaseRequest.GetValue(question, "type") == "typeToMatch" &&
                            <>
                            The respondent will need to type this exact answer:
                            </>
                          }
                          <List sortable sortableEnabled className="no-margin-vertical"
                            onSortableSort = { (event) => {
                              this.reorderAnswerToQuestionDragFromDropTo(DatabaseRequest.GetValue(question, "timestamp"), event.detail.from, event.detail.to)
                            }}
                          >
                            { DatabaseRequest.GetValue(question, "answers") && DatabaseRequest.GetValue(question, "answers").map((answer, index) =>
                              <ListInput
                                key={ index }
                                className="no-padding"
                                colorTheme="black"
                                type="textarea"
                                resizable
                                required
                                placeholder="Type an answer..."
                                defaultValue={ answer.answer }
                                onInput = { (event) => {
                                  this.editAnswerToQuestionAtIndex(DatabaseRequest.GetValue(question, "timestamp"), index, event.target.value)
                                }}
                              >
                                { DatabaseRequest.GetValue(question, "type") != "typeToMatch" &&
                                  <Link noLinkClass slot="media" onClick={ () => this.toggleCorrectAnswerToQuestionAtIndex(DatabaseRequest.GetValue(question, "timestamp"), index) } style={{ position:"absolute", top:15, left:35 }}><Icon f7={ answer.correct ? "check_round_fill" : "check_round" }/></Link>
                                }
                                { DatabaseRequest.GetValue(question, "type") != "trueFalse" && DatabaseRequest.GetValue(question, "type") != "typeToMatch" &&
                                  <Link noLinkClass slot="media" onClick={ () => this.removeAnswerToQuestionAtIndex(DatabaseRequest.GetValue(question, "timestamp"), index) } style={{ position:"absolute", top:15, left:0 }}><Icon f7="delete_round"/></Link>
                                }
                              </ListInput>
                            )}
                            { DatabaseRequest.GetValue(question, "type") != "trueFalse" && DatabaseRequest.GetValue(question, "type") != "typeToMatch" &&
                              <Link noLinkClass onClick={ () => this.addAnswerToQuestion(DatabaseRequest.GetValue(question, "timestamp")) } className="margin-left margin-top" color="gray">
                                <Block className="no-margin-vertical">
                                  <Icon f7="add_round_fill"/>
                                  &nbsp;
                                  Add choice...
                                </Block>
                              </Link>
                            }
                          </List>
                          </>
                        }
                      </Block>
                    }
                  </List>
                </Block>
              }
              </div>
            )}

          </div>
          
        </div>
        }

      </Page>
    )
  }
}
