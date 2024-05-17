/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React from 'react';
import { Page, Navbar, NavTitle, NavRight, Link, Block, Chip, Icon, Popup, Searchbar, ListInput, List, Button, Row, AccordionItem, AccordionToggle, AccordionContent } from 'framework7-react';

import CollectionList from './CollectionList';
import HomePageMenuLinks from './HomePageMenuLinks';
import ContentCard from './ContentCard';

import DatabaseRequest from "../frameworks/DatabaseRequest";
import F7Utils from "../utils/F7Utils";
import CollectionUtils from '../utils/CollectionUtils';

export default class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      brand: '',
      popupOpened: false,
      btnLogin: true,
      btnSignup: false,
      brandField: false,
      searchTerm: this.props.searchTerm ? this.props.searchTerm.replace("+", " ") : null,
      content: null,
      contentAnalytics: null,
      loading: false
    };
    this.searchTimeout = null;
    this.openLoginPopup = this.openLoginPopup.bind(this);
    this.closeLoginPopup = this.closeLoginPopup.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.resetLoginScreen = this.resetLoginScreen.bind(this);
    this.resetSignupScreen = this.resetSignupScreen.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit = async () => {

    let app = this.$f7;

    var user = await DatabaseRequest.FetchObjects({
      class: "User",
      equalTo: {
        email: this.state.email
      },
      limit: 1
    });
    if (user) {
      if (this.state.password !== '') {
        this.logIn();
      }
      else {
        app.dialog.alert("", "Enter your password", () => {
        });
        this.setState({ brandField: false, btnLogin: true, btnSignup: false });
      }
    }
    else {
      if (this.state.password !== '' && this.state.brand !== '') {
        this.signUp();
      }
      else {
        if (this.state.brandField) {
          app.dialog.alert("", "Enter your password and username", () => {
          });
        }
        this.setState({ brandField: true, btnSignup: true, btnLogin: false });
      }
    }
  }

  signUp = async() => {

    let self = this;
    let app = self.$f7;

    const user = await DatabaseRequest.UserSignUp({
      username: this.state.email,
      password: this.state.password,
      email: this.state.email,
      brand: this.state.brand
    });
    if (user) {
      //this.setState({ popupOpened: false });
      DatabaseRequest.LogUserAction({
        "action": "signup"
      });
      app.dialog.alert("User account created. Click OK to set up your new account.", "Welcome to LOOK.education", () => {
        //app.loginScreen.close();
        window.location.reload();
        // TODO: refresh the collections list, now that the user signed up... or better, reload the entire page
      });
    }
    else {
      app.loginScreen.close();
    }
  }

  logIn = async() => {

    let app = this.$f7;

    const user = await DatabaseRequest.UserLogIn(this.state.email, this.state.password);
    if (user.error) {
      app.dialog.alert(user.error, "Can't log in", () => {
      });
    }
    else {
      //this.setState({ popupOpened:false });
        //app.loginScreen.close();
        DatabaseRequest.LogUserAction({
          "action": "login"
        });
        window.location.reload();
        // TODO: refresh the collections list, now that the user logged in... or better, reload the entire page
    }
  }

  logOut = async() => {
    const user = DatabaseRequest.GetCurrentUser();
    await DatabaseRequest.UserLogOut();
    DatabaseRequest.LogUserAction({
      "action": "logout",
      "user": user
    });
    window.location.reload();
    // TODO: refresh the collections list, now that the user logged out... or better, reload the entire page
  }

  resetLoginScreen = () => {
    this.setState({ password:'', brandField:false, btnLogin:true, btnSignup:false });
  }

  resetSignupScreen = () => {
    this.setState({ password:'', brandField:true, btnLogin:false, btnSignup:true });
  }

  openLoginPopup() {
    this.setState({ popupOpened: true });
  }

  closeLoginPopup() {
    this.setState({ popupOpened: false });
  }

  resetPassword = async () => {
    if (!this.state.email) {
      if (this.refEmail) this.refEmail.setState({ inputInvalid:true });
      return;
    }
    let app = this.$f7;

    if (!await DatabaseRequest.UserRequestPasswordReset(this.state.email)) {
      app.dialog.alert("Error: " + error.code + " " + error.message, () => {
      });
    }
    //this.resetUserForm();
    app.dialog.alert(this.state.email + "<br /><br />Verify your inbox, and follow the email instructions to reset your JuniorTube password.<br /><br />The email will come from <a href='mailto:support@look.education'>support@look.education</a>, make sure you look in both Spam and Inbox folders.", "Password Reset", () => {
    });
  }

  /* shouldComponentUpdate(nextProps, nextState) {
    if (nextState.content != this.state.content) {
      return true;
    }
    if (nextState.popupOpened != this.state.popupOpened) {
      return true;
    }
    if (nextState.popupClose != this.state.popupClose) {
      return true;
    }
    return false;
  } */

  search = async (searchbar, query, previousQuery) => {
    var self = this;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(function () {
      self.searchExecute(query);
    }, 500);
  }

  searchExecute = async (searchTerm) => {
    if (!searchTerm || searchTerm == undefined) searchTerm = null;
    this.setState({ searchTerm:searchTerm, content:null, contentAnalytics:null });
    if (!searchTerm && this.props.latest) {
      this.fetchLatestContent();
    }
    else {
      if (searchTerm) {
        this.fetchSearchContent(searchTerm);
      }
    }
  }

  fetchSearchContent = async (searchTerm) => {
    if (!searchTerm) {
      return;
    }
    this.setState({ loading:true });
    searchTerm = searchTerm.replace("+", " ");
    F7Utils.SetDocumentTitle(searchTerm);
    const content = await CollectionUtils.FetchSearchContent(searchTerm);
    var contentAnalytics;
    if (content) {
      contentAnalytics = await CollectionUtils.FetchContentAnalyticsForContentList(content);
    }
    this.setState({ loading:false, searchTerm:searchTerm, content:content, contentAnalytics:contentAnalytics });
  }

  fetchLatestContent = async () => {
    this.setState({ loading:true });
    F7Utils.SetDocumentTitle("Latest Content");
    const content = await CollectionUtils.FetchLatestContent({
      quizzes: this.props.quizzes
    });
    var contentAnalytics;
    if (content) {
      contentAnalytics = await CollectionUtils.FetchContentAnalyticsForContentList(content);
    }
    this.setState({ loading:false, searchTerm:null, content:content, contentAnalytics:contentAnalytics });
  }

  componentDidMount() {
    if (this.props.searchTerm) {
      F7Utils.SetDocumentTitle(this.props.searchTerm);
      this.fetchSearchContent(this.props.searchTerm);
    }
    if (this.props.latest || this.props.quizzes) {
      this.fetchLatestContent();
    }
  }

  render() {

    let app = this.$f7;

    var userLogo = DatabaseRequest.GetCurrentUser() ? DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "logo") : null;
    if (!userLogo) {
      userLogo = '/static/img/user-logo.png';
    }

    return (
      <Page>
        <Navbar bgColor="white">
          <NavTitle colorTheme="black">
            <Link className={ !F7Utils.IsLargeScreen(app) ? "no-padding-left" : "" } href="/" external><img src="/static/img/look-education-sticker.png" height="50" /></Link>
          </NavTitle>
          { DatabaseRequest.GetCurrentUser() &&
            <NavRight colorTheme="black">
              { F7Utils.IsLargeScreen(app) &&
                <Searchbar
                  inline
                  customSearch
                  backdrop
                  placeholder="Find content..."
                  disableButton={!this.$theme.aurora}
                  onSearchbarSearch={ (searchbar, query, previousQuery) => {
                    this.search(searchbar, query, previousQuery);
                  }}
                ></Searchbar>
              }
              <Link panelOpen="right"><img className="rounded" alt="" src={ userLogo } height="38" valign="middle" /></Link>
            </NavRight>
          }
          { !DatabaseRequest.GetCurrentUser() &&
            <NavRight colorTheme="black">
              <Link onClick={ this.openLoginPopup }><img className="rounded" alt="" src={ userLogo } height="38" valign="middle" /></Link>
            </NavRight>
          }
        </Navbar>
  
        { !F7Utils.IsLargeScreen(app) &&
          <Searchbar
            customSearch
            backdrop
            placeholder="Find content..."
            disableButton={!this.$theme.aurora}
            onSearchbarSearch={ (searchbar, query, previousQuery) => {
              this.search(searchbar, query, previousQuery);
            }}
          ></Searchbar>
        }

        <div style={{ zIndex:"-10000", position:"absolute", top:0, width:"100%", height:"50%", opacity:0.1, backgroundImage:"linear-gradient(black, white)" }}></div>

        <br />

        <Block className="no-margin-top no-margin-bottom">
          <Link noLinkClass href="https://github.com/nehloo/look-education" target="_blank" className="external float-right margin-right"><Chip className="elevation-hover-3 elevation-transition margin-left" text="Contribute" mediaBgColor="gray" style={{ cursor:"pointer" }}>
            <Icon slot="media" ios="f7:logo_github" aurora="f7:logo_github" md="f7:logo_github"></Icon>
          </Chip></Link>
        
          { !F7Utils.IsLargeScreen(app) &&
            <>
              <AccordionItem key={0}>
                <AccordionToggle>
                  <Chip className="margin-left" text="Action Menu" color="yellow" textColor="black" mediaBgColor="black" style={{ cursor:"pointer" }}>
                    <Icon slot="media" ios="f7:menu" aurora="f7:menu" md="f7:bars"></Icon>
                  </Chip>
                  <Link animate={false} noLinkClass href={ this.props.latest ? "/" : "/latest" }><Chip className="elevation-hover-3 elevation-transition margin-left" text="" mediaBgColor="teal">
                    <Icon slot="media" f7={ this.props.latest ? "layers_alt_fill" : "timer" }></Icon>
                  </Chip></Link>
                </AccordionToggle>
                <AccordionContent>
                  <br />
                  <HomePageMenuLinks userId={ this.props.userId } favorites={ this.props.favorites } latest={ this.props.latest } quizzes={ this.props.quizzes } onePerLine={ true } />
                </AccordionContent>
              </AccordionItem>
            </>
          }
        
          { F7Utils.IsLargeScreen(app) &&
            <HomePageMenuLinks userId={ this.props.userId } favorites={ this.props.favorites } latest={ this.props.latest } quizzes={ this.props.quizzes } />
          }

        </Block>

        <br />

        { !DatabaseRequest.GetCurrentUser() &&
          <Block>
            <Button color="blue" large fill raised outline className="margin-horizontal margin-vertical" onClick={ this.openLoginPopup }><b>Join LOOK.education</b></Button>
          </Block>
        }

        { this.props.latest && !this.state.searchTerm &&
          <Block className="no-margin-vertical">
            <h1>Latest Content</h1>
          </Block>
        }

        { this.props.userId && !this.state.searchTerm &&
          <Block className="no-margin-vertical">
            <h1>
              { this.props.userId == DatabaseRequest.GetId(DatabaseRequest.GetCurrentUser()) &&
                <>My Collections</>
              }
            </h1>
          </Block>
        }

        { this.props.quizzes && !this.state.searchTerm &&
          <Block className="no-margin-vertical">
            <h1>Quizzes &amp; Surveys</h1>
          </Block>
        }

        { this.props.favorites && !this.state.searchTerm &&
          <Block className="no-margin-vertical">
            <h1>My Favorites</h1>
          </Block>
        }

        { this.state.searchTerm &&
          <Block className="no-margin-vertical">
            <h1>"{ this.state.searchTerm }"</h1>
          </Block>
        }

        { ((!this.props.latest && !this.props.quizzes) || this.state.searchTerm) &&
          <CollectionList className="collectionList" userId={ this.props.userId } favorites={ this.props.favorites } searchTerm={ this.state.searchTerm } />
        }

        { this.state.content &&
          <Row className="justify-content-flex-start">
            {this.state.content.map((content, index) => {
              const contentAnalytics = this.state.contentAnalytics ? this.state.contentAnalytics.find(item => DatabaseRequest.GetId(DatabaseRequest.GetValue(item, "content")) == DatabaseRequest.GetId(content)) : null;
              return (
                <ContentCard key={ DatabaseRequest.GetId(content) } content={ content } contentAnalytics={ contentAnalytics } showCollectionTitle={ true } />
              )}
            )}
          </Row>
        }

        { this.state.loading &&
          <Row className="justify-content-flex-start">
            <ContentCard/>
          </Row>
        }

        { !DatabaseRequest.GetCurrentUser() &&
          <Block className="text-align-center">
            <Link color="blue" href="https://github.com/nehloo/look-education" external target="_blank">LOOK.education &nbsp; | &nbsp; Open-source Visual LMS</Link>
            <br />
            2019 &copy; Nehloo Interactive LLC
            <br /><br />
          </Block>
        }

        {/* <Block className="no-margin-top padding-top text-align-center">
          Powered by <img valign="middle" alt="" src="/static/img/look-education-sticker.png" height="30" />
        </Block> */}

        {/* login */}

        <Popup className="demo-popup" opened={ this.state.popupOpened } onPopupClose={ this.closeLoginPopup }>
          <Page>
            <Navbar title="My Account">
              <NavRight>
                <Link popupClose onClick={ this.resetLoginScreen }>Close</Link>
              </NavRight>
            </Navbar>
            <Block>
              <List form>
                <ListInput
                  ref={(c) => this.refEmail = c}
                  label="E-mail"
                  type="email"
                  placeholder="Your email"
                  className="text"
                  value={this.state.email}
                  onInput={(e) => {
                    this.setState({ email: e.target.value.toLowerCase() });
                  }}
                />
                <ListInput
                  label="Password"
                  type="password"
                  placeholder="Your password"
                  value={this.state.password}
                  onInput={(e) => {
                    this.setState({ password: e.target.value });
                  }}
                />
                {(this.state.brandField === true) &&
                  <ListInput
                    label="Brand or Channel"
                    type="text"
                    placeholder="Your brand or channel name"
                    value={this.state.brand}
                    onInput={(e) => {
                      this.setState({ brand: e.target.value });
                    }}
                  />}
              </List>
              <Block>
                { this.state.btnLogin  &&
                  <>
                  <Button raised large fill onClick={ this.handleSubmit }>Login</Button>
                  <Button raised onClick={ this.resetPassword } className="margin-top">Forgot password?</Button>
                  <br />
                  <center>
                    <Link onClick={ this.resetSignupScreen }>Create new account?</Link>
                  </center>
                  </>
                }
                { this.state.btnSignup  &&
                  <>
                  <Button raised large fill onClick={ this.handleSubmit }>SignUp</Button>
                  <br />
                  <center>
                    <Link onClick={ this.resetLoginScreen }>Already have an account?</Link>
                  </center>
                  </>
                }
              </Block>
            </Block>
          </Page>
        </Popup>
      </Page >
    );
  }
}
