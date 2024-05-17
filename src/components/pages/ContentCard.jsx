/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React, { Component } from 'react';
import { Button, Col, Card, CardContent, CardHeader, CardFooter, Icon, Link, Popover, List, ListItem, SkeletonBlock } from 'framework7-react';

import Moment from 'react-moment';

import DatabaseRequest from '../frameworks/DatabaseRequest';
import CollectionUtils from '../utils/CollectionUtils';
import F7Utils from '../utils/F7Utils';

export default class ContentCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: this.props.content,
      contentAnalytics: this.props.contentAnalytics
    }
    this.action = {
      video: 'Watched'
    }
  }

  renameResource = () => {
    let app = this.$f7;
    app.dialog.prompt('', "Rename Resource:", async(newTitle) => {
      if (await CollectionUtils.RenameContent(this.state.content, newTitle)) {
        this.setState({ content:this.state.content });
      }
    }, function(cancel) {}, DatabaseRequest.GetValue(this.state.content, "title"));
    F7Utils.FocusPromptInput(this);
  }

  render() {
    const content = this.state.content;
    const contentAnalytics = this.state.contentAnalytics;

    var duration = DatabaseRequest.GetValue(content, "duration") || DatabaseRequest.GetValue(contentAnalytics, "duration") || 0;

    var watchedPercentage = 0;
    var intervals;
    if (contentAnalytics)
    if (DatabaseRequest.GetValue(contentAnalytics, "intervals")) {
      var intervals = DatabaseRequest.GetValue(contentAnalytics, "intervals").slice();
      if (intervals) {
        intervals.sort((a, b) => a[0] - b[0]);
        var seconds = 0;
        var lastInterval;
        for (var interval of intervals) {
          var nextInterval = interval.slice();
          if (lastInterval) {
            if (interval[0] < lastInterval[1]) {
              nextInterval[0] = lastInterval[1];
            }
            if (interval[1] < lastInterval[1]) {
              nextInterval[1] = lastInterval[1];
            }
          }
          seconds += nextInterval[1] - nextInterval[0];
          lastInterval = nextInterval;
        }
        duration = DatabaseRequest.GetValue(content, "duration") || DatabaseRequest.GetValue(contentAnalytics, "duration") || (lastInterval ? ((lastInterval.length == 2) ? lastInterval[1] : 0) : 0);
        watchedPercentage = duration ? ((seconds * 100) / duration) : 0;
        watchedPercentage = Math.ceil(watchedPercentage);
        if (watchedPercentage > 100) watchedPercentage = 100;
      }
    }

    const hasPublicReadAccess = DatabaseRequest.HasPublicReadAccess(content);
    const publicAccessIcon = hasPublicReadAccess ? "world" : "lock_fill";
    const collection = DatabaseRequest.GetValue(content, "collection");
    var topCollection;
    if (collection) {
      topCollection = DatabaseRequest.GetValue(collection, "topCollection");
    }

    const thumbnail = DatabaseRequest.GetValue(content, "thumbnail");

    const isOwner = DatabaseRequest.GetId(DatabaseRequest.GetValue(content, "user")) == DatabaseRequest.GetId(DatabaseRequest.GetCurrentUser());

    const quizPreferences = DatabaseRequest.GetValue(content, "quizPreferences");

    return (
    <Col key={ DatabaseRequest.GetId(content) } width="100" tabletWidth="33" desktopWidth="33" className="margin-bottom">
        <Card className="elevation-5 elevation-hover-10 elevation-transition" style={{ backgroundColor:"#efefef" }}>
          <Link noLinkClass routeProps={{ contentAnalytics:contentAnalytics }} href={ '/watch/' + DatabaseRequest.GetId(content) }>
          { !content &&
            <SkeletonBlock className="skeleton-effect-blink elevation-10 elevation-hover-20 elevation-transition" style={{ width:'100%', height:180 }} />
          ||
            <CardHeader
              className="no-border elevation-5"
              valign="bottom"
              style={{ height: 180, backgroundImage: "url('" + thumbnail + "')", backgroundPosition: 'center', padding:0, opacity:1, textAlign:"center" }}
            ></CardHeader>
          }
          { intervals && duration &&
            <>
              <span style={{ position:"absolute", left:0, right:0, top:180, height:"10px", backgroundColor:"gray", opacity:0.1 }}></span>
              {intervals.map((interval, index) => (
                <span key={"interval-" + index} style={{ position:"absolute", top:180, left:(interval[0]*100/duration)+"%", right:(100-interval[1]*100/duration)+"%", height:"10px", backgroundColor:"green", opacity:((intervals.length > 100) ? 0.05 : (intervals.length > 70) ? 0.1 : ((intervals.length > 40) ? 0.2 : 0.3)) }}></span>
              ))}
            </>
          }
          { !content &&
            <CardContent className="skeleton-text skeleton-effect-blink">
              <h3 className="text-color-gray no-margin-bottom" width="100%">Content Title...</h3>
              <span>Author Name...</span>
            </CardContent>
          ||
            <CardContent className="no-padding-top">
              <h3 className="text-color-black no-margin-bottom wrap">{ DatabaseRequest.GetValue(content, "title") }</h3>
              <span className="text-color-gray">{ DatabaseRequest.GetValue(content, "authorName") }</span>
            </CardContent>
          }
          </Link>
          { quizPreferences &&
            <CardContent className="no-padding-top">
              <Button fill large colorTheme="purple" textColor="white" href={ "/quiz/" + DatabaseRequest.GetId(content) }>Take The Quiz <Icon f7="check"/></Button>
              { !quizPreferences.includes("mandatory") &&
                <Button large textColor="gray" href={ "/watch/" + DatabaseRequest.GetId(content) }>Just Watch <Icon f7="play"/></Button>
              }
            </CardContent>
          }
          { this.props.showCollectionTitle &&
            <>
            <CardContent className="no-padding-vertical truncated">
              <Link noLinkClass href={ "/collection/" + DatabaseRequest.GetId(topCollection) } textColor="gray">
                <Icon size="16px" color="gray" f7="layers_alt_fill" style={{ verticalAlign:"middle" }}></Icon>
                { DatabaseRequest.GetValue(topCollection, "title") }
              </Link>
              <br />
              <Link noLinkClass href={ "/collection/" + DatabaseRequest.GetId(collection) } className="margin-left" textColor="gray">
                <Icon size="16px" color="gray" f7="arrow_right" style={{ verticalAlign:"middle" }}></Icon>
                { DatabaseRequest.GetValue(collection, "title") }
              </Link>
            </CardContent>
            </>
          }
          { !content &&
            <CardFooter>
                <Icon f7="menu" className="skeleton-text skeleton-effect-blink"></Icon>
                <Icon f7="menu" className="skeleton-text skeleton-effect-blink"></Icon>
            </CardFooter>
          ||
            <>
            <CardFooter>
              <div>
              { isOwner &&
                <>
                <Link className="margin-right" popoverOpen={ ".popover-menu-" + DatabaseRequest.GetId(content) } noLinkClass>
                  <Icon f7="menu"></Icon>
                </Link>
                <Popover className={ "popover-menu-" + DatabaseRequest.GetId(content) }>
                  <List>
                    <ListItem link={ "/quiz/" + DatabaseRequest.GetId(content) + "/edit" } popoverClose title={ DatabaseRequest.GetValue(content, "quizPreferences") ? "Edit Quiz" : "Create Quiz" } />
                    <ListItem link="#" popoverClose title="Rename" onClick={ this.renameResource } />
                  </List>
                </Popover>
                </>
              }
                <Icon f7={ publicAccessIcon }></Icon>
              </div>
              <span>
                <img alt="" src={ "/static/provider/" + DatabaseRequest.GetValue(content, "provider") + ".png" } height="20" valign="middle" />&nbsp; { this.action[DatabaseRequest.GetValue(content, "type")] + " " + watchedPercentage + "%" }
              </span>
            </CardFooter>
            </>  
          }
        </Card>
      </Col>
    )
  }
}
