/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React from 'react'
import { Page, Link, Icon, Row, Col, Block, List, ListItem, ListInput, Button, Preloader, Navbar, NavLeft, NavTitle } from 'framework7-react'

import ReactPlayer from 'react-player'

import CanvasDraw from "react-canvas-draw"

import DatabaseRequest from "../frameworks/DatabaseRequest"
import CollectionUtils from '../utils/CollectionUtils'
import VideoUtils from '../utils/VideoUtils'
import JSUtils from '../utils/JSUtils'

export default class VideoPlayPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      content: null,
      quiz: null,
      quizSubmitted: false
    }
    this.progress = {
      firstSeconds: 0,
      lastSeconds: 0,
      intervals: []
    }
    this.contentAnalytics = null
    this.player = null
    this.resumeFromTimestamp = null
    this.takequiz = this.props.takequiz || null
    this.skipQuestions = -1
    this.nextQuestion = null
    this.answers = []
    this.evaluations = []
    this.quizAnswers = []
    this.quizSubmitAnswer = this.quizSubmitAnswer.bind(this)
    this.quizSubmitAllAnswers = this.quizSubmitAllAnswers.bind(this)
    this.anonymousEmailAddress = null
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
        document.title = await DatabaseRequest.GetValue(content, "title")
        // this.props.contentAnalytics may be different if
        // current user is an admin of a collection
        // and watches a video from subscriber's analytics page
        if (this.props.contentAnalytics && DatabaseRequest.GetCurrentUser()) {
          if (DatabaseRequest.GetId(DatabaseRequest.GetValue(this.props.contentAnalytics, "user")) === DatabaseRequest.GetId(DatabaseRequest.GetCurrentUser())) {
            this.contentAnalytics = this.props.contentAnalytics
          }
        }
        if (!this.contentAnalytics) {
          this.contentAnalytics = await CollectionUtils.FetchContentAnalyticsForContentList([content])
          if (this.contentAnalytics) {
            if (this.contentAnalytics.length == 1) {
              this.contentAnalytics = this.contentAnalytics[0]
            }
          }
        }
        // quiz
        const quizPreferences = DatabaseRequest.GetValue(content, "quizPreferences");
        if (!this.takequiz && quizPreferences)
          this.takequiz = quizPreferences.includes("mandatory")
        if (this.takequiz) {
          if (quizPreferences.includes("preview")) {
            const quiz = await DatabaseRequest.FetchObjects({
              class: "QuizQuestions",
              equalTo: {
                content: content
              },
              notEqualTo: {
                deleted: true
              },
              ascending: ["timestamp"],
              limit: 1000
            })
            this.setState({ content:content, quiz:quiz })
          }
          else {
            this.setState({ content:content })
            this.skipQuestions = 0
            this.nextQuestion = await this.getNextQuestion()
          }
          DatabaseRequest.LogUserAction({
            "action": "quiz",
            "collection": DatabaseRequest.GetValue(content, "collection"),
            "content": content
          })
        }
        else {
          this.setState({ content:content })
          DatabaseRequest.LogUserAction({
            "action": "watch",
            "collection": DatabaseRequest.GetValue(content, "collection"),
            "content": content
          })
        }
        // resume the video
        if (!this.takequiz) {
          if (DatabaseRequest.GetValue(this.contentAnalytics, "intervals")) {
            var intervals = DatabaseRequest.GetValue(this.contentAnalytics, "intervals").slice()
            if (intervals) {
              intervals.sort((a, b) => a[0] - b[0])
              this.resumeFromTimestamp = 0
              for (var interval of intervals) {
                if (interval[0] > this.resumeFromTimestamp && interval[1] > this.resumeFromTimestamp) {
                  break
                }
                if (interval[1] > this.resumeFromTimestamp) {
                  this.resumeFromTimestamp = interval[1]
                }
              }
            }
          }
        }
      }
    }
  }

  async componentWillUnmount() {
    await this.addProgressInterval()
  }

  async getNextQuestion() {
    if (!this.state.content) return null
    const query = {
      class: "QuizQuestions",
      equalTo: {
        content: this.state.content
      },
      notEqualTo: {
        deleted: true
      },
      ascending: ["timestamp"],
      skip: this.skipQuestions,
      limit: 1
    }
    const question = await DatabaseRequest.FetchObjects(query)
    return question
  }

  async updateDurationIfNeeded(duration) {
    // if current user has access to saving the content object
    // save duration in the content object
    // TODO: also check if user is a moderator, with save rights
    if (DatabaseRequest.GetId(DatabaseRequest.GetValue(this.state.content, 'user')) === DatabaseRequest.GetId(DatabaseRequest.GetCurrentUser())) {
      if (this.state.content && duration)
      if (!DatabaseRequest.GetValue(this.state.content, "duration")) {
        DatabaseRequest.SetValue(this.state.content, "duration", duration)
        await DatabaseRequest.SaveObject(this.state.content)
      }
    }
    // if current user is not admin for current content object
    // save duration in their contentAnalytics object
    else {
      if (this.contentAnalytics && duration)
      if (!DatabaseRequest.GetValue(this.contentAnalytics, "duration")) {
        DatabaseRequest.SetValue(this.contentAnalytics, "duration", duration)
      }
    }
  }

  quizSetAnswerAtTimestamp(timestamp, index, event) {
    // identify the question at timestamp
    const questions = this.state.quiz.filter((item, j) => DatabaseRequest.GetValue(item, "timestamp") === timestamp)
    if (!questions) return
    if (!questions.length) return
    this.nextQuestion = questions[0]
    // if the question has predefined answers
    const answers = DatabaseRequest.GetValue(this.nextQuestion, "answers")
    if (answers) {
      // if expected answer type is "type to match"
      // the respondent was expected to type the exact answer, case-sensitive
      if (DatabaseRequest.GetValue(this.nextQuestion, "type") === "typeToMatch") {
        const answer = event.target.value
        var validAnswer = true
        if (!answer)
          validAnswer = false
        else if (!answer.length)
          validAnswer = false
        if (validAnswer) {
          const correctAnswer = answers[0].answer
          this.answers[timestamp] = [answer]
          if (answer === correctAnswer)
            this.evaluations[timestamp] = true
          else
            this.evaluations[timestamp] = false
        }
        else {
          this.answers[timestamp] = null
          this.evaluations[timestamp] = null
        }
      }
      else {
        const correctAnswers = answers.map(obj => obj.correct)
        // if expected answer type is "single choice" or "true/false"
        if (DatabaseRequest.GetValue(this.nextQuestion, "type") === "singleChoice" || DatabaseRequest.GetValue(this.nextQuestion, "type") === "trueFalse") {
          // there is one single answer to check
          this.answers[timestamp] = [index]
          if (correctAnswers[index])
            this.evaluations[timestamp] = true
          else
            this.evaluations[timestamp] = false
        }
        // if expected answer type is "multiple choice"
        else if (DatabaseRequest.GetValue(this.nextQuestion, "type") === "multipleChoice") {
          // there are multple answers to check
          var answer = this.answers[timestamp]
          if (event.target.checked) {
            if (!answer)
              answer = [index]
            else
              answer.push(index)
            answer = [...new Set(answer)]
          }
          else {
            answer = answer.filter(item => item !== index)
          }
          this.answers[timestamp] = answer
          var answerCheck = []
          this.evaluations[timestamp] = true
          correctAnswers.some((value, i) => {
            answerCheck.push(answer.includes(i))
            if (value != answerCheck[i]) {
              this.evaluations[timestamp] = false
              return true
            }
          })
        }
      }
    }
    else if (DatabaseRequest.GetValue(this.nextQuestion, "type") === "openEnded") {
      const answer = event.target.value
      var validAnswer = true
      if (!answer)
        validAnswer = false
      else if (!answer.length)
        validAnswer = false
      if (validAnswer)
        this.answers[timestamp] = [answer]
      else {
        this.answers[timestamp] = null
        this.evaluations[timestamp] = null
      }
    }
  }

  async quizSubmitAllAnswers() {
    if (!DatabaseRequest.GetCurrentUser() && !this.anonymousEmailAddress) {
      let app = this.$f7
      app.dialog.alert("", "Please enter your email address.", () => {
      })
      return
    }
    var shouldSubmit = true
    this.state.quiz.some((question) => {
      if (DatabaseRequest.GetValue(question, "type") !== "noAnswerRequired") {
        const timestamp = DatabaseRequest.GetValue(question, "timestamp")
        if (!this.answers[timestamp]) {
          shouldSubmit = false
          return true
        }
        if (!this.answers[timestamp].length) {
          shouldSubmit = false
          let app = this.$f7
          app.dialog.alert("", "Please answer the question.", () => {
          })
          return true
        }
      }
    })
    if (shouldSubmit) {
      this.state.quiz.map((question) => {
        const timestamp = DatabaseRequest.GetValue(question, "timestamp")
        // TODO: optimize saving multiple answers
        this.quizSubmitAnswer(timestamp)
      })
      this.setState({ quizSubmitted:true })
      DatabaseRequest.LogUserAction({
        "action": "submitAllQuizAnswers",
        "collection": DatabaseRequest.GetValue(this.state.content, "collection"),
        "content": this.state.content
      })
    }
    else {
      let app = this.$f7
      app.dialog.alert("", "Please answer all questions.", () => {
      })
    }
  }

  async quizSubmitAnswer(timestamp=false) {
    if (!DatabaseRequest.GetCurrentUser() && !this.anonymousEmailAddress) {
      let app = this.$f7
      app.dialog.alert("", "Please enter your email address.", () => {
      })
      return
    }
    // if the entire quiz is displayed
    // nextQuestionTimestamp will be delivered by quizSetAnswerAtTimestamp()
    // otherwise, nextQuestionTimestamp is the timestamp of next question
    const nextQuestionTimestamp = timestamp || DatabaseRequest.GetValue(this.nextQuestion, "timestamp")
    // if the user didn't answer this question
    // exit
    if (DatabaseRequest.GetValue(this.nextQuestion, "type") !== "noAnswerRequired") {
      if (!this.answers[nextQuestionTimestamp]) return
      if (!this.answers[nextQuestionTimestamp].length) {
        let app = this.$f7
        app.dialog.alert("", "Please answer the question.", () => {
        })
      }
    }
    // check if the user answered this question in this session
    var quizAnswer = this.quizAnswers[nextQuestionTimestamp] || null
    if (!quizAnswer) {
      const topCollectionId = DatabaseRequest.GetId(DatabaseRequest.GetValue(DatabaseRequest.GetValue(this.state.content, "collection"), "topCollection"))
      var adminsTopCollectionId = "admins-" + topCollectionId
      if (!topCollectionId) {
        try {
          const contentACL = DatabaseRequest.GetACL(this.state.content)
          const permissionsById = contentACL.permissionsById
          for (const key of Object.keys(permissionsById)) {
            if (key.includes("role:admins-")) {
              adminsTopCollectionId = "admins-" + key.replace("role:admins-", "")
              break
            }
          }
        } catch(e) {}
      }
      quizAnswer = DatabaseRequest.CreateObject({
        class: "QuizAnswers",
        set: {
          user: DatabaseRequest.GetCurrentUser(),
          content: this.state.content,
          question: this.nextQuestion,
          timestamp: nextQuestionTimestamp,
          anonymousEmailAddress: this.anonymousEmailAddress || null
        },
        acl: {
          publicRead: false,
          publicWrite: false,
          // current user may READ his/her answers and score results
          userReadAccess: [
            DatabaseRequest.GetCurrentUser()
          ],
          // content admins may READ user's answers and score results
          roleReadAccess: [
            adminsTopCollectionId
          ]
        }
      })
      this.quizAnswers[nextQuestionTimestamp] = quizAnswer
    }
    DatabaseRequest.SetValue(quizAnswer, "answer", this.answers[nextQuestionTimestamp])
    DatabaseRequest.SetValue(quizAnswer, "evaluation", this.evaluations[nextQuestionTimestamp])
    await DatabaseRequest.SaveObject(quizAnswer)
    // retain a fake answer for noAnswerRequired, for UI purposes
    if (DatabaseRequest.GetValue(this.nextQuestion, "type") === "noAnswerRequired") {
      this.answers[nextQuestionTimestamp] = 'OK'
    }
    // if the entire quiz is displayed
    // continue playing the video
    // and skip to the next question
    const quizPreferences = DatabaseRequest.GetValue(this.state.content, "quizPreferences");
    if (!quizPreferences.includes("preview")) {
      try {
        if (this.player.player.player) {
          this.setState({ quizSubmitted:true })
          this.skipQuestions++
          this.nextQuestion = await this.getNextQuestion()
          const player = this.player.player.player
          player.play()
        }
      } catch(e) {}
      DatabaseRequest.LogUserAction({
        "action": "submitOneQuizAnswer",
        "collection": DatabaseRequest.GetValue(this.state.content, "collection"),
        "content": this.state.content,
        "answer": quizAnswer
      })
    }
  }

  async trackProgress(progress) {
    // if the user takes a quiz
    if (this.takequiz) {
      const nextQuestionTimestamp = DatabaseRequest.GetValue(this.nextQuestion, "timestamp")
      const quizPreferences = DatabaseRequest.GetValue(this.state.content, "quizPreferences");
      if (nextQuestionTimestamp && !quizPreferences.includes("preview"))
      if (progress.playedSeconds >= nextQuestionTimestamp) {
        try {
          if (this.player.player.player) {
            const player = this.player.player
            if (player.isPlaying) {
              player.player.pause()
              player.player.seekTo(nextQuestionTimestamp, "seconds")
              this.nextQuestion = await this.getNextQuestion()
              var quiz = this.state.quiz
              var shouldRender = false
              if (quiz) {
                // make sure it's a unique question, and don't re-add
                if (!quiz.some(question => DatabaseRequest.GetValue(question, "timestamp") === DatabaseRequest.GetValue(this.nextQuestion, "timestamp"))) {
                  quiz = [this.nextQuestion, ...quiz.slice()]
                  shouldRender = true
                }
              }
              else {
                quiz = [this.nextQuestion]
                shouldRender = true
              }
              if (shouldRender)
                this.setState({ quiz:quiz, quizSubmitted:false })
            }
          }
        } catch(e) {}
      }
    }

    let seekDiff = progress.playedSeconds - this.progress.lastSeconds
    if (seekDiff < 0) seekDiff = 0 - seekDiff
    if (seekDiff > 1.5) {
      if (this.progress.firstSeconds != progress.playedSeconds) {
        this.addProgressInterval()
      }
      this.progress.firstSeconds = progress.playedSeconds
      this.progress.lastSeconds = progress.playedSeconds
    }
    this.progress.lastSeconds = progress.playedSeconds
  }

  handleSeek(seconds) {
    this.trackProgress({
      playedSeconds: seconds
    })
  }

  async addProgressInterval() {
    var shouldPushNewInterval = true
    let seekDiff = this.progress.firstSeconds - this.progress.lastSeconds
    if (seekDiff < 0) seekDiff = 0 - seekDiff
    if (seekDiff > 1.5) {
      if (this.progress.intervals) {
        shouldPushNewInterval = true
        if (this.progress.intervals.length) {
          let lastInterval = this.progress.intervals[this.progress.intervals.length - 1]
          shouldPushNewInterval = (lastInterval[0] != this.progress.firstSeconds)
        }
      } else {
        shouldPushNewInterval = true
      }
    }
    if (shouldPushNewInterval && (this.progress.firstSeconds != this.progress.lastSeconds) && (this.progress.firstSeconds < this.progress.lastSeconds)) {
      this.progress.intervals.push([parseFloat(this.progress.firstSeconds.toFixed(3)), parseFloat(this.progress.lastSeconds.toFixed(3))])
    }
    this.progress.firstSeconds = this.progress.lastSeconds
    await this.saveIntervals()
  }

  async saveIntervals() {
    if (this.contentAnalytics && this.state.content && this.progress.intervals.length) {
      var intervals
      if (DatabaseRequest.GetValue(this.contentAnalytics, "intervals")) {
        intervals = DatabaseRequest.GetValue(this.contentAnalytics, "intervals").slice()
      }
      if (!intervals) {
        intervals = this.progress.intervals
      }
      else {
        intervals = intervals.concat(this.progress.intervals)
      }
      this.progress.intervals = []
      DatabaseRequest.SetValue(this.contentAnalytics, "intervals", intervals)
      if (DatabaseRequest.GetCurrentUser()) DatabaseRequest.SetValue(this.contentAnalytics, "user", DatabaseRequest.GetCurrentUser())
      DatabaseRequest.SetValue(this.contentAnalytics, "content", this.state.content)
      await DatabaseRequest.SaveObject(this.contentAnalytics)
    }
  }

  seekToQuestion(timestamp) {
    var player = null
    try {
      if (this.player.player) {
        player = this.player.player
        player.player.pause()
        player.player.seekTo(timestamp, "seconds")
      }
    } catch(e) {}
  }

  render() {

    const videoUrl = VideoUtils.GetVideoUrlFromContent(this.state.content) || null
    var video = null
    if (videoUrl) {
      video = (
        <>
        <ReactPlayer url={ videoUrl } playing playsinline controls width="100%" height="100%"
          ref={player => this.player = player}
          onReady = { () => {
            if (this.resumeFromTimestamp)
            if ((this.resumeFromTimestamp - 3) > 0) {
              this.player.seekTo(this.resumeFromTimestamp - 3, "seconds")
            }
          }}
          onDuration = { (duration) => {
            if (this.state.content && duration) {
              this.updateDurationIfNeeded(duration)
            }
            else if (this.contentAnalytics && duration) {
              this.updateDurationIfNeeded(duration)
            }
          }}
          onProgress = { (progress) => {
            this.trackProgress(progress)
          }}
          onSeek = { (seconds) => {
            this.handleSeek(seconds)
          }}
          onPause = { () => {
            this.addProgressInterval() // save interval
          }}
          onEnded = { () => {
            // make sure that the progress hits the end of the content
            var duration
            if (this.state.content) duration = DatabaseRequest.GetValue(this.state.content, "duration")
            if (!duration && this.contentAnalytics) duration = DatabaseRequest.GetValue(this.contentAnalytics, "duration")
            if (duration) this.progress.lastSeconds = duration
            this.addProgressInterval() // save interval
          }}
        />
        {/* <CanvasDraw
          style={{ position:"absolute", top:0, width:"100%", height:"100%" }}
          backgroundColor="transparent"
          catenaryColor="#fff"
          lazyRadius={0}
          brushRadius={1}
          brushColor="#fff"
          hideGrid
        /> */}
        </>
      )
    }

    const showInstantFeedback = DatabaseRequest.GetValue(this.state.content, "quizPreferences") && DatabaseRequest.GetValue(this.state.content, "quizPreferences").includes("feedback")

    return (
      <Page colorTheme="deeppurple" style={{ backgroundColor:"#171717" }}>
        <Navbar bgColor="black" size="30">
          <NavLeft colorTheme="black" style={{ width:"40px", height:"32px" }}>
            <Link back colorTheme="white" animate={DatabaseRequest.GetCurrentUser() ? !DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "accessibilityReduceMotion") : false}>
              <Icon f7="arrow_left" className="margin-right"></Icon>
              <img alt="" src="/static/img/look-education-sticker.png" height="24" />
            </Link>
          </NavLeft>
        </Navbar>

        { videoUrl &&
          <Preloader size={60} color="multi" className={ videoUrl ? "display-none" : "centeredScreen centeredScreenPreloader60x60" }></Preloader>
        }

        { this.takequiz &&
          <Row>
            <Col width="100" tabletWidth="70" desktopWidth="70" className="video-quiz elevation-10 margin-bottom">
              { video }
            </Col>
            <Col width="100" tabletWidth="30" desktopWidth="30" bgColor="white" textColor="black" className="padding">
              <Block className="no-margin-top no-padding"><h3 className="no-margin-top">{ DatabaseRequest.GetValue(this.state.content, "title") }</h3></Block>
              { !DatabaseRequest.GetCurrentUser() &&
                <List>
                  <ListInput
                    className="no-padding elevation-3"
                    colorTheme="black"
                    bgColor="yellow"
                    type="email"
                    validate
                    placeholder="Your email address..."
                    onBlur={ () => this.anonymousEmailAddress = event.target.value.length ? event.target.value.toLowerCase() : null }
                  />
                </List>
              }
              { this.state.quiz && this.state.quiz.map((question) =>
                <div key={ DatabaseRequest.GetValue(question, "timestamp") }>
                  <Link noLinkClass bgColor={ (typeof this.answers[DatabaseRequest.GetValue(question, "timestamp")] !== "undefined") ? "gray" : "deeppurple" } textColor="white" className="elevation-1 elevation-hover-3 elevation-transition no-padding-vertical padding-horizontal" onClick={ () => this.seekToQuestion(DatabaseRequest.GetValue(question, "timestamp")) }>{ JSUtils.FormatTimestamp(DatabaseRequest.GetValue(question, "timestamp"), "milliseconds") }</Link>
                  <h3>{ DatabaseRequest.GetValue(question, "question") }</h3>
                  { DatabaseRequest.GetValue(question, "answers") &&
                    <List className="no-margin-vertical">
                      { DatabaseRequest.GetValue(question, "type") === "typeToMatch" &&
                        <ListInput
                          className="no-padding elevation-3"
                          colorTheme="black"
                          type="textarea"
                          placeholder="Type your answer, ad litteram..."
                          disabled={ typeof this.answers[DatabaseRequest.GetValue(question, "timestamp")] !== "undefined" }
                          onBlur={ () => this.quizSetAnswerAtTimestamp(DatabaseRequest.GetValue(question, "timestamp"), 0, event) }
                        />
                      }
                      { DatabaseRequest.GetValue(question, "type") !== "typeToMatch" && DatabaseRequest.GetValue(question, "answers").map((answer, index) =>
                        <ListItem key={ index } checkbox={ DatabaseRequest.GetValue(question, "type") != "singleChoice" && DatabaseRequest.GetValue(question, "type") !== "trueFalse" } radio={ DatabaseRequest.GetValue(question, "type") === "singleChoice" || DatabaseRequest.GetValue(question, "type") === "trueFalse" } name={ DatabaseRequest.GetValue(question, "timestamp").toString() }
                          onChange={ () => this.quizSetAnswerAtTimestamp(DatabaseRequest.GetValue(question, "timestamp"), index, event) }
                          disabled={ typeof this.answers[DatabaseRequest.GetValue(question, "timestamp")] !== "undefined" }
                          colorTheme={ (typeof this.answers[DatabaseRequest.GetValue(question, "timestamp")] !== "undefined") ? "gray" : "deeppurple" }
                          textColor={ showInstantFeedback && ((typeof this.answers[DatabaseRequest.GetValue(question, "timestamp")] !== "undefined") && ((!this.answers[DatabaseRequest.GetValue(question, "timestamp")].includes(index) && answer.correct) || (DatabaseRequest.GetValue(question, "type") === "multipleChoice" && this.answers[DatabaseRequest.GetValue(question, "timestamp")].includes(index) && !answer.correct))) ? "red" : "black" }
                        >
                          { answer.answer }
                        </ListItem>
                      )}
                    </List>
                  }
                  { DatabaseRequest.GetValue(question, "type") === "openEnded" &&
                    <List className="no-margin-vertical">
                      <ListInput
                        className="no-padding elevation-3"
                        colorTheme="black"
                        type="textarea"
                        placeholder="Type your open-ended answer..."
                        disabled={ typeof this.answers[DatabaseRequest.GetValue(question, "timestamp")] !== "undefined" }
                        onBlur={ () => this.quizSetAnswerAtTimestamp(DatabaseRequest.GetValue(question, "timestamp"), 0, event) }
                      />
                    </List>
                  }
                  { this.skipQuestions > -1 && this.state.quiz && !this.state.quizSubmitted && (typeof this.answers[DatabaseRequest.GetValue(question, "timestamp")] === "undefined") &&
                    <Button fill large
                      onClick={ () => this.quizSubmitAnswer() }
                    >{ (DatabaseRequest.GetValue(question, "type") !== "noAnswerRequired") ? "Submit" : "OK" }</Button>
                  }
                  { showInstantFeedback && (typeof this.answers[DatabaseRequest.GetValue(question, "timestamp")] !== "undefined") && DatabaseRequest.GetValue(question, "type") !== "noAnswerRequired" &&
                    <>
                    <Button fill large className="no-margin-top margin-bottom" color={ DatabaseRequest.GetValue(question, "type") === "openEnded" ? "gray" : (this.evaluations[DatabaseRequest.GetValue(question, "timestamp")] ? "green" : "red") } textColor={ DatabaseRequest.GetValue(question, "type") === "openEnded" ? "white" : (this.evaluations[DatabaseRequest.GetValue(question, "timestamp")] ? "black" : "white") }>{ DatabaseRequest.GetValue(question, "type") === "openEnded" ? "Not Evaluated Yet" : (this.evaluations[DatabaseRequest.GetValue(question, "timestamp")] ? "Correct" : "Incorrect") }</Button>
                    { DatabaseRequest.GetValue(question, "type") === "typeToMatch" && !this.evaluations[DatabaseRequest.GetValue(question, "timestamp")] && DatabaseRequest.GetValue(question, "answers") && DatabaseRequest.GetValue(question, "answers")[0] && DatabaseRequest.GetValue(question, "answers")[0].answer &&
                      <Link noLinkClass textColor="red">Correct answer:<br /><br /><b>{ DatabaseRequest.GetValue(question, "answers")[0].answer }</b></Link>
                    }
                    </>
                  }
                  <Block><hr/></Block>
                </div>
              )
              ||
                  <Block>
                    <Preloader></Preloader> &nbsp; Waiting for next question...
                  </Block>
              }
              { this.skipQuestions == -1 && this.state.quiz && !this.state.quizSubmitted &&
                <>
                <Button fill large
                  onClick={ () => this.quizSubmitAllAnswers() }
                >Submit All</Button>
                <br />
                <br />
                </>
              }
            </Col>
          </Row>
        
        ||

          <>
          { video &&
            video
          }
          </>
        
        }

      </Page>
    )
  }
}
