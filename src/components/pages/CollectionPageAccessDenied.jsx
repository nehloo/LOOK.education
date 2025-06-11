/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React, { Component } from 'react';
import { Block, Link, Card, CardContent, CardHeader, CardFooter, Button, Icon, List, ListInput } from 'framework7-react';

import DatabaseRequest from '../frameworks/DatabaseRequest';

export default class CollectionPageAccessDenied extends Component {
  constructor(props) {
    super(props);
    this.emailAccessRequest = '';
  }

  sendAccessRequest = async () => {
    let app = this.$f7;
    let router = this.$f7.views.main.router; // $f7router is not available in sub-components
    if (!this.emailAccessRequest || typeof this.emailAccessRequest === undefined || typeof this.emailAccessRequest === null || !this.emailAccessRequest.length) {
      app.dialog.alert("", "Please enter your email address.", () => {
      });
      return false;
    }
    if (!this.props.collection && !this.props.collectionId) {
      return false;
    }
    var collectionId;
    if (this.props.collectionId)
      collectionId = this.props.collectionId;
    else if (this.props.collection)
      collectionId = DatabaseRequest.GetId(this.props.collection);
    if (!collectionId) {
      return false;
    }
    const accessRequest = await DatabaseRequest.CreateObject({
      class: "AccessRequests",
      set: {
        collection: DatabaseRequest.GetPointerById("Collections", collectionId),
        user: DatabaseRequest.GetCurrentUser(),
        requestedBy: this.emailAccessRequest
      },
      acl: {
        publicRead: false,
        publicWrite: false,
        roleReadAccess: [
          "admins-" + collectionId
        ]
      }
    });
    if (accessRequest) {
      await DatabaseRequest.SaveObject(accessRequest);
      app.dialog.alert("Keep an eye on your inbox or this website, to learn if or when you will be provided with access to this private resource.", "Your request was successfully sent to the resource owner", () => {
        if (!DatabaseRequest.GetCurrentUser()) {
          app.dialog.alert("You will be granted access to this resource only for your account with user name '" + this.emailAccessRequest + "'.", "Next, sign up with your email address: " + this.emailAccessRequest, () => {
            router.navigate('/');
          });
        }
        else {
          router.navigate('/');
        }
      });
    }
    else {
      app.dialog.alert("That's all we know.", "There was an error", () => {
      });
    }
    return accessRequest;
  }

  render() {

    this.emailAccessRequest = DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "email");
    if (!this.emailAccessRequest) { 
      this.emailAccessRequest = '';
    }

    return (
      <>
      <Block>
        <div className="row justify-content-flex-start">
          <Col></Col>
          <div tabletWidth="33" className="col-100 margin-bottom">
            <Card className="elevation-5 elevation-hover-10 elevation-transition">
              <CardHeader className="no-border">
                <div className="truncated">
                  <img alt="" className="rounded bordered" style={{ opacity:0.4 }} src="./img/user-logo.png" width="34" height="34" valign="middle" />
                  &nbsp; Undisclosed Owner
                </div>
              </CardHeader>
              <CardContent>
                <CardHeader
                  className="grayscale no-border elevation-10 elevation-hover-20 elevation-transition"
                  valign="bottom"
                  style={{ height:100, backgroundImage:"url('')", backgroundPosition:'center',
                  opacity:0.6, background:"rgba(0,0,0,0.8)" }}
                >
                  <div style={{ backgroundColor:"#000", position:"absolute", right:0, top:0, height:"100%", width:"40%", background:"rgba(0,0,0,0.8)", textAlign:"center" }}>
                    <br />
                    <Icon size="64px" color="gray" ios="f7:layers_alt_fill" aurora="f7:layers_alt_fill" md="f7:layers_alt_fill" style={{ verticalAlign:"middle" }}></Icon>
                  </div>
                </CardHeader>
                <h3 className="no-margin-bottom text-color-black">Private Resource</h3>
                <br />
                You've accessed a unique link to a private resource.
                Most likely, someone you know shared it with you.
                We can email to the owner of this resource, with your request for access, if you enter your email address below.
                If you're unsure about the origin of this resource, please leave this page now. <Link external href="https://github.com/nehloo/look-education" target="_blank">Terms of Service.</Link>
              </CardContent>
              <CardFooter className={"no-border no-padding-vertical"}>
                <span>
                  <List form>
                    <ListInput
                      label="Your Email:"
                      floatingLabel
                      type="email"
                      textColor="red"
                      defaultValue={ this.emailAccessRequest }
                      placeholder="Enter your email..."
                      className="text"
                      outline
                      required
                      validate
                      validateOnBlur
                      onInput={(e) => {
                        this.emailAccessRequest = e.target.value.toLowerCase();
                      }}
                      onChange={(e) => {
                        this.emailAccessRequest = e.target.value.toLowerCase();
                      }}
                    />
                    </List>
                  <Button fill color="red" className="margin-bottom" onClick={ () => this.sendAccessRequest() }><b>Request Access</b></Button>
                </span>
                <span>
                  <Icon ios="f7:eye_off" aurora="f7:eye_off" md="f7:eye_off" style={{ verticalAlign:"middle" }}></Icon>
                </span>
              </CardFooter>
            </Card>
          </div>
          <Col></Col>
        </div>
      </Block>
      <Block className="text-align-center">
        <Link color="blue" href="https://github.com/nehloo/look-education" external target="_blank">LOOK.education &nbsp; | &nbsp; Open-source Visual LMS</Link>
        <br />
        2019 &copy; Nehloo Foundation, Inc.
        <br /><br />
      </Block>
      </>
    )
  }
}