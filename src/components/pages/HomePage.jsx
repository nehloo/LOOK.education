/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */
import Framework7 from 'framework7/lite-bundle';

import React, { useState, useEffect, useRef } from 'react';
import {
  Page, Navbar, NavTitle, NavRight, Link, Block, Chip, Icon, Popup, Searchbar,
  ListInput, List, Button, AccordionItem, AccordionToggle, AccordionContent
} from 'framework7-react';

import CollectionList from './CollectionList';
import HomePageMenuLinks from './HomePageMenuLinks';
import ContentCard from './ContentCard';

import DatabaseRequest from "../frameworks/DatabaseRequest";
import F7Utils from "../utils/F7Utils";
import CollectionUtils from '../utils/CollectionUtils';

export default function HomePage({ latest, favorites, quizzes, ...props }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [brand, setBrand] = useState('');
  const [popupOpened, setPopupOpened] = useState(false);
  const [btnLogin, setBtnLogin] = useState(true);
  const [btnSignup, setBtnSignup] = useState(false);
  const [brandField, setBrandField] = useState(false);
  const [searchTerm, setSearchTerm] = useState(props.searchTerm ? props.searchTerm.replace("+", " ") : null);
  const [content, setContent] = useState(null);
  const [contentAnalytics, setContentAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(undefined);
  const currentUser = DatabaseRequest.GetCurrentUser();

  const timeoutRef = useRef(null);
  const refEmail = useRef(null);

  useEffect(() => {
    console.log("🕐 HomePage mounted, initializing Framework7 instance");
    const f7 = Framework7.instance;
    if (!f7) {
      console.error("Framework7 instance is not initialized.");
      return;
    }

    console.log("🕐 HomePage mounted, checking isLargeScreen");
    setIsLargeScreen(F7Utils.IsLargeScreen(f7));
    console.log("🕐 isLargeScreen:", isLargeScreen);

    if (props.searchTerm) {
      F7Utils.SetDocumentTitle(props.searchTerm);
      fetchSearchContent(props.searchTerm);
    } else if (props.latest || props.quizzes) {
      fetchLatestContent();
    }
  }, []);

  const fetchLatestContent = async () => {
    setLoading(true);
    F7Utils.SetDocumentTitle("Latest Content");
    const result = await CollectionUtils.FetchLatestContent({ quizzes: props.quizzes });
    const analytics = result ? await CollectionUtils.FetchContentAnalyticsForContentList(result) : null;
    setContent(result);
    setContentAnalytics(analytics);
    setSearchTerm(null);
    setLoading(false);
  };

  const fetchSearchContent = async (term) => {
    if (!term) return;
    setLoading(true);
    const cleanTerm = term.replace("+", " ");
    F7Utils.SetDocumentTitle(cleanTerm);
    const result = await CollectionUtils.FetchSearchContent(cleanTerm);
    const analytics = result ? await CollectionUtils.FetchContentAnalyticsForContentList(result) : null;
    setContent(result);
    setContentAnalytics(analytics);
    setSearchTerm(cleanTerm);
    setLoading(false);
  };

  const searchExecute = async (term) => {
    const actualTerm = term || null;
    setSearchTerm(actualTerm);
    setContent(null);
    setContentAnalytics(null);
    if (!actualTerm && props.latest) {
      fetchLatestContent();
    } else if (actualTerm) {
      fetchSearchContent(actualTerm);
    }
  };

  const handleSearch = (searchbar, query, previousQuery) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => searchExecute(query), 500);
  };

  const resetLoginScreen = () => {
    setPassword('');
    setBrandField(false);
    setBtnLogin(true);
    setBtnSignup(false);
  };

  const resetSignupScreen = () => {
    setPassword('');
    setBrandField(true);
    setBtnLogin(false);
    setBtnSignup(true);
  };

  const handleSubmit = async () => {
    const user = await DatabaseRequest.FetchObjects({
      class: "User",
      equalTo: { email },
      limit: 1
    });

    if (user) {
      if (password !== '') {
        logIn();
      } else {
        f7.dialog.alert("", "Enter your password");
        setBrandField(false);
        setBtnLogin(true);
        setBtnSignup(false);
      }
    } else {
      if (password !== '' && brand !== '') {
        signUp();
      } else {
        if (brandField) {
          f7.dialog.alert("", "Enter your password and username");
        }
        setBrandField(true);
        setBtnSignup(true);
        setBtnLogin(false);
      }
    }
  };

  const signUp = async () => {
    const user = await DatabaseRequest.UserSignUp({ username: email, password, email, brand });
    if (user) {
      DatabaseRequest.LogUserAction({ action: "signup" });
      f7.dialog.alert("User account created. Click OK to set up your new account.", "Welcome to LOOK.education", () => {
        window.location.reload();
      });
    } else {
      f7.loginScreen.close();
    }
  };

  const logIn = async () => {
    const user = await DatabaseRequest.UserLogIn(email, password);
    if (user.error) {
      f7.dialog.alert(user.error, "Can't log in");
    } else {
      DatabaseRequest.LogUserAction({ action: "login" });
      window.location.reload();
    }
  };

  const logOut = async () => {
    const user = DatabaseRequest.GetCurrentUser();
    await DatabaseRequest.UserLogOut();
    DatabaseRequest.LogUserAction({ action: "logout", user });
    window.location.reload();
  };

  const resetPassword = async () => {
    if (!email) {
      if (refEmail.current) refEmail.current.setState({ inputInvalid: true });
      return;
    }
    if (!await DatabaseRequest.UserRequestPasswordReset(email)) {
      f7.dialog.alert("Error: couldn't request password reset");
    }
    f7.dialog.alert(`${email}<br /><br />Verify your inbox to reset your password.<br /><br />Check Spam & Inbox folders.`, "Password Reset");
  };

  if (isLargeScreen === undefined) {
    console.warn("🕐 Waiting for isLargeScreen check");
    return null;
  }
  else {
    console.log("🕐 HomePage isLargeScreen:", isLargeScreen);
  }

  return (
    <Page name="home">
      <Navbar bgColor="white">
        <NavTitle colorTheme="black">
          <Link className={ isLargeScreen ? "" : "no-padding-left" } href="/" external><img src="./img/look-education-sticker.png" height="50" /></Link>
        </NavTitle>
        { currentUser &&
          <NavRight colorTheme="black">
            { isLargeScreen &&
              <Searchbar
                inline
                customSearch
                backdrop
                placeholder="Find content..."
                disableButton={false} /**{!$theme.aurora}}*/
                onSearchbarSearch={ (searchbar, query, previousQuery) => {
                  search(searchbar, query, previousQuery);
                }}
              ></Searchbar>
            }
          </NavRight>
        }
        { !currentUser &&
          <NavRight colorTheme="black">
            <Link onClick={() => setPopupOpened(true)}><img className="rounded" alt="" src={ DatabaseRequest.GetValue(currentUser, "logo") } height="38" valign="middle" /></Link>
          </NavRight>
        }
      </Navbar>

      { !isLargeScreen &&
        <Searchbar
          customSearch
          backdrop
          placeholder="Find content..."
          disableButton={!$theme.aurora}
          onSearchbarSearch={ (searchbar, query, previousQuery) => {
            search(searchbar, query, previousQuery);
          }}
        ></Searchbar>
      }

      <div style={{ zIndex:"-10000", position:"absolute", top:0, width:"100%", height:"50%", opacity:0.1, backgroundImage:"linear-gradient(black, white)" }}></div>

      <br />

      <Block className="no-margin-top no-margin-bottom">
        <Link noLinkClass href="https://github.com/nehloo/LOOK.education" target="_blank" className="external float-right margin-right"><Chip className="elevation-hover-3 elevation-transition margin-left" text="Contribute" mediaBgColor="gray" style={{ cursor:"pointer" }}>
          <Icon slot="media" ios="f7:logo_github" aurora="f7:logo_github" md="f7:logo_github"></Icon>
        </Chip></Link>
      
        { !isLargeScreen &&
          <>
            <AccordionItem key={0}>
              <AccordionToggle>
                <Chip className="margin-left" text="Action Menu" color="yellow" textColor="black" mediaBgColor="black" style={{ cursor:"pointer" }}>
                  <Icon slot="media" ios="f7:menu" aurora="f7:menu" md="f7:bars"></Icon>
                </Chip>
                <Link animate={false} noLinkClass href={ props.latest ? "/" : "/latest" }><Chip className="elevation-hover-3 elevation-transition margin-left" text="" mediaBgColor="teal">
                  <Icon slot="media" f7={ props.latest ? "layers_alt_fill" : "timer" }></Icon>
                </Chip></Link>
              </AccordionToggle>
              <AccordionContent>
                <br />
                <HomePageMenuLinks userId={ props.userId } favorites={ props.favorites } latest={ props.latest } quizzes={ props.quizzes } onePerLine={ true } />
              </AccordionContent>
            </AccordionItem>
          </>
        }
      
        { isLargeScreen &&
          <HomePageMenuLinks userId={ props.userId } favorites={ props.favorites } latest={ props.latest } quizzes={ props.quizzes } />
        }

      </Block>

      <br />

      { !currentUser &&
        <Block>
          <Button color="blue" large fill raised outline className="margin-horizontal margin-vertical" onClick={() => setPopupOpened(true)}><b>Join LOOK.education</b></Button>
        </Block>
      }

      { props.latest && !searchTerm &&
        <Block className="no-margin-vertical">
          <h1>Latest Content</h1>
        </Block>
      }

      { props.userId && !searchTerm &&
        <Block className="no-margin-vertical">
          <h1>
            { props.userId == DatabaseRequest.GetId(currentUser) &&
              <>My Collections</>
            }
          </h1>
        </Block>
      }

      { props.quizzes && !searchTerm &&
        <Block className="no-margin-vertical">
          <h1>Quizzes &amp; Surveys</h1>
        </Block>
      }

      { props.favorites && !searchTerm &&
        <Block className="no-margin-vertical">
          <h1>My Favorites</h1>
        </Block>
      }

      { searchTerm &&
        <Block className="no-margin-vertical">
          <h1>"{ searchTerm }"</h1>
        </Block>
      }

      { ((!props.latest && !props.quizzes) || searchTerm) &&
        <CollectionList className="collectionList" userId={ props.userId } favorites={ props.favorites } searchTerm={ searchTerm } />
      }

      { content &&
        <div className="row justify-content-flex-start">
          {content.map((content, index) => {
            const contentAnalytics = contentAnalytics ? contentAnalytics.find(item => DatabaseRequest.GetId(DatabaseRequest.GetValue(item, "content")) == DatabaseRequest.GetId(content)) : null;
            return (
              <ContentCard key={ DatabaseRequest.GetId(content) } content={ content } contentAnalytics={ contentAnalytics } showCollectionTitle={ true } />
            )}
          )}
        </div>
      }

      { loading &&
        <div className="row justify-content-flex-start">
          <ContentCard/>
        </div>
      }

      { !currentUser &&
        <Block className="text-align-center">
          <Link color="blue" href="https://github.com/nehloo/LOOK.education" external target="_blank">LOOK.education &nbsp; | &nbsp; Open-source Visual LMS</Link>
          <br />
          {new Date().getFullYear()} &copy; Nehloo Foundation, Inc. / Nehloo Interactive
          <br /><br />
        </Block>
      }

      {/* <Block className="no-margin-top padding-top text-align-center">
        Powered by <img valign="middle" alt="" src="./img/look-education-sticker.png" height="30" />
      </Block> */}

      {/* login */}

      <Popup className="demo-popup" opened={ popupOpened } onPopupClose={() => setPopupOpened(false)}>
        <Page>
          <Navbar title="My Account">
            <NavRight>
              <Link popupClose onClick={ resetLoginScreen }>Close</Link>
            </NavRight>
          </Navbar>
          <Block>
            <List form>
              <ListInput
                ref={refEmail}
                label="Email"
                type="email"
                placeholder="you@example.com"
                name="email"
                autocomplete="email"
                className="text"
                value={email}
                required
                onInput={(e) => {
                  setEmail(e.target.value.toLowerCase());
                }}
              />
              <ListInput
                label="Password"
                type="password"
                name="password"
                autocomplete="current-password"
                placeholder="Your secure password"
                value={password}
                required
                onInput={(e) => {
                  setPassword(e.target.value);
                }}
              />
              {(brandField === true) &&
                <ListInput
                  label="Brand or Channel"
                  type="text"
                  placeholder="Your brand or channel name"
                  value={brand}
                  onInput={(e) => {
                    setBrand(e.target.value);
                  }}
                />}
            </List>
            <Block>
              { btnLogin  &&
                <>
                <Button raised large fill onClick={ handleSubmit }>Login</Button>
                <Button raised onClick={ resetPassword } className="margin-top">Forgot password?</Button>
                <br />
                <center>
                  <Link onClick={ resetSignupScreen }>Create new account?</Link>
                </center>
                </>
              }
              { btnSignup  &&
                <>
                <Button raised large fill onClick={ handleSubmit }>SignUp</Button>
                <br />
                <center>
                  <Link onClick={ resetLoginScreen }>Already have an account?</Link>
                </center>
                </>
              }
            </Block>
          </Block>
        </Page>
      </Popup>
    </Page>
  );
}
