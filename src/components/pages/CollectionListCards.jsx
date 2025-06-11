/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React from 'react';
import { Icon, Link, Card, CardContent, CardHeader, CardFooter, SkeletonBlock } from 'framework7-react';

import NumericLabel from 'react-pretty-numbers';
import pluralize from 'pluralize';

import DatabaseRequest from "../frameworks/DatabaseRequest"

export default class CollectionListCards extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    
    var collections = this.props.collections;
    if (!collections.length) {
      collections = [];
    }

    let isTopCollection = this.props.parentCollectionId ? false : true;

    const showTopCollectionTitle = this.props.showTopCollectionTitle;
    
    let collectionsRendered = collections && collections.length > 0 && collections.map(function (collection, index) {
      if (!collection) { // TODO: add a dummy collection, that user can click to add a new collection
        return (<></>);
      }
      var assetTypes = [];
      if (DatabaseRequest.GetValue(collection, 'providers')) {
        assetTypes = DatabaseRequest.GetValue(collection, 'providers').map((provider) =>
          <span key={ DatabaseRequest.GetId(collection) + '-' + provider }>
          { DatabaseRequest.GetValue(collection, 'providersCount') &&
          <>
          { DatabaseRequest.GetValue(DatabaseRequest.GetValue(collection, 'providersCount'), provider) > 0 &&
            <>
            &nbsp; <img alt="" src={ "./provider/" + provider + ".png" } height="20" width="20" />
            </>
          }
          </>
          }
          </span>
        );
      }
      let collectionIcon = 'layers_alt_fill';
      let isVR = false;
      if (DatabaseRequest.GetValue(collection, 'providers'))
      if ((DatabaseRequest.GetValue(collection, 'providers').includes("vr") && DatabaseRequest.GetValue(collection, 'countVr') > 0) || (DatabaseRequest.GetValue(collection, 'providers').includes("ar") && DatabaseRequest.GetValue(collection, 'countAr') > 0)) {
        collectionIcon = 'eye_fill';
        isVR = true;
      }
      const topCollection = DatabaseRequest.GetValue(collection, "topCollection");
      const parentCollection = DatabaseRequest.GetValue(collection, "parentCollection");
      const hasPublicReadAccess = DatabaseRequest.HasPublicReadAccess(collection);
      const title = DatabaseRequest.GetValue(collection, 'title');
      const user = DatabaseRequest.GetValue(collection, 'user');
      const brand = user ? DatabaseRequest.GetValue(user, 'brand') : "";
      const logo = user ? DatabaseRequest.GetValue(user, 'logo') : "";
      const contentCount = DatabaseRequest.GetValue(collection, 'contentCount');
      const totalContentCount = DatabaseRequest.GetValue(collection, 'totalContentCount');
      const collectionsCount = DatabaseRequest.GetValue(collection, 'collectionsCount');
      const totalCollectionsCount = DatabaseRequest.GetValue(collection, 'totalCollectionsCount');
      const subscribersCount = DatabaseRequest.GetValue(collection, 'subscribersCount');
      const publicAccessIcon = hasPublicReadAccess ? "world" : "lock_fill";
      var thumbnail = DatabaseRequest.GetValue(collection, 'thumbnail');
      if (!thumbnail && (totalContentCount || totalCollectionsCount)) {
        thumbnail = DatabaseRequest.GetValue(DatabaseRequest.GetValue(collection, 'parentCollection'), "thumbnail");
      }
      if (!thumbnail && (totalContentCount || totalCollectionsCount)) {
        thumbnail = DatabaseRequest.GetValue(DatabaseRequest.GetValue(collection, 'topCollection'), "thumbnail");
      }
      return (
        <div key={ DatabaseRequest.GetId(collection) } tabletWidth="33" desktopWidth="25" className="col-100 margin-bottom search-item">
          <Card className="elevation-5 elevation-hover-10 elevation-transition">
            { isTopCollection &&
            <CardHeader className="no-border">
              <div className="truncated">
                <img alt="" className="rounded bordered" src={ logo } width="34" height="34" valign="middle" />
                &nbsp; <Link href={ "/" + DatabaseRequest.GetId(user) } colorTheme="black">{ brand }</Link>
              </div>
              <Link></Link>
            </CardHeader>
            }
            <a href={ isVR ? "/ar/" : ("/collection/" + DatabaseRequest.GetId(collection)) }>
            <CardContent>
              { !thumbnail &&
                <SkeletonBlock className=" elevation-10 elevation-hover-20 elevation-transition" style={{ width:'100%', height:180 }} />
              }
              { thumbnail &&
                <CardHeader
                  className="grayscale no-border elevation-10 elevation-hover-20 elevation-transition"
                  valign="bottom"
                  style={{ height:180, backgroundImage:"url('" + thumbnail + "')", backgroundPosition:'center',
                  opacity:0.6 }}
                >
                  <div style={{ backgroundColor:"#000", position:"absolute", right:0, top:0, height:"100%", width:"40%", background:"rgba(0,0,0,0.8)", textAlign:"center" }}>
                    <br />
                    <Icon size="64px" color="gray" ios={ "f7:" + collectionIcon } aurora={ "f7:" + collectionIcon } md={ "f7:" + collectionIcon } style={{ verticalAlign:"middle" }}></Icon>
                  </div>
                </CardHeader>
              }
              {/* TODO: if the user doesn't have any collections, the link below should call the "addCollection" function from HomePage */}
              <h3 className="no-margin-bottom text-color-black">{ title }</h3>
              { totalCollectionsCount && collectionsCount != totalCollectionsCount &&
                <>
                {collectionsCount ? collectionsCount : 0}
                /
                <span className="margin-right">{pluralize('collection', totalCollectionsCount)}</span>
                </>
              }
              { collectionsCount && (!totalCollectionsCount || collectionsCount == totalCollectionsCount) &&
                <span className="margin-right">{pluralize('collection', totalCollectionsCount)}</span>
              }
              { totalContentCount && contentCount != totalContentCount &&
                <>
                {contentCount ? contentCount : 0}
                /
                <span className="margin-right">{pluralize('item', totalCollectionsCount)}</span>
                </>
              }
              { contentCount && (!totalContentCount || contentCount == totalContentCount) &&
                <span className="margin-right">{pluralize('item', totalCollectionsCount)}</span>
              }
            </CardContent>
            { showTopCollectionTitle &&
              <>
              <CardContent className="no-padding-vertical truncated">
                { DatabaseRequest.GetValue(topCollection, "title") &&
                  <Link noLinkClass href={ "/collection/" + DatabaseRequest.GetId(topCollection) } textColor="gray">
                    <Icon size="16px" color="gray" f7="layers_alt_fill" style={{ verticalAlign:"middle" }}></Icon>
                    { DatabaseRequest.GetValue(topCollection, "title") }
                  </Link>
                }
                { DatabaseRequest.GetValue(parentCollection, "title") && (DatabaseRequest.GetId(parentCollection) != DatabaseRequest.GetId(topCollection)) &&
                  <>
                  <br />
                  <Link noLinkClass href={ "/collection/" + DatabaseRequest.GetId(parentCollection) } className="margin-left" textColor="gray">
                    <Icon size="16px" color="gray" f7="arrow_right" style={{ verticalAlign:"middle" }}></Icon>
                    { DatabaseRequest.GetValue(parentCollection, "title") }
                  </Link>
                  </>
                }
              </CardContent>
              </>
            }
            <CardFooter className="no-border no-padding-vertical">
              <span>
                <Icon className="margin-right" ios={"f7:"+publicAccessIcon} aurora={"f7:"+publicAccessIcon} md={"f7:"+publicAccessIcon}></Icon>
                { !DatabaseRequest.HasPublicReadAccess(collection) && !parentCollection &&
                  <span><NumericLabel params={{ justification:'L', shortFormat: true, shortFormatPrecision: 1, shortFormatMinValue: 1000 }}>{subscribersCount ? subscribersCount : 0}</NumericLabel> { subscribersCount == 1 ? 'subscriber' : 'subscribers' }</span>
                }
              </span>
              <span>{assetTypes}</span>
            </CardFooter>
            </a>
          </Card>
        </div>
      );
    });

    return (
      <>
      <div className="row collections-list search-list justify-content-flex-start">
        { collectionsRendered }
      </div>
      </>
    );
  }
}