/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 * @credits    @JeaNugroho, @nehloo
 */

import React from 'react';

import DatabaseRequest from '../frameworks/DatabaseRequest';

class ARExperience extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            objects: []
        }
        this.activeObject = null;
        this.handleObjectClick = this.handleObjectClick.bind(this);
    }
    componentDidMount() {

        var self = this;

        {/*TODO: list all objects found in the database
                        With Javascript, query Parse to get all the objects in this collection
                        set a variable to store all the objects found in Parse
                        var objects = [parseObject1, parseObject2, ...]
                        this.setState({ objects:objects });*/}

        //content.set("collection", this.state.collection); TODO: replace this.state.collection with a Parse class object that will store the collection object with ID "D0uYWeBwSs"
        const collection = DatabaseRequest.FetchObjects({
            class: "Collections",
            equalTo: {
                objectId: "D0uYWeBwSs"
            },
            limit: 1
        })
        const content = DatabaseRequest.FetchObjects({
            class: "Content",
            equalTo: {
                collection: collection
            },
            descending: "createdAt",
            limit: 1000
        })
        this.setState({ objects:content });

        AFRAME.registerComponent('ground-listener', {
            init: function() {
                const ground = document.createElement('a-entity');
                
                ground.setAttribute('geometry', 'primitive: box; width: 30; height: 1; depth: 30');
                ground.setAttribute('material', 'color: #1b8518');
                ground.setAttribute('position', '0 -2 0');
                ground.setAttribute('visible', 'true');
                this.el.appendChild(ground);
            
                ground.addEventListener('click', event => {
                    const newElement = document.createElement('a-entity');
                    const touchPoint = event.detail.intersection.point;
                    newElement.setAttribute('position', touchPoint);
                    newElement.setAttribute('rotation', '0 0 0');
                    newElement.setAttribute('scale', '0.005 0.005 0.005');
                    newElement.setAttribute('visible', 'false');
                    newElement.setAttribute('gltf-model', "#" + self.activeObject);
                    this.el.appendChild(newElement);
                    newElement.addEventListener('model-loaded', () => {
                        newElement.setAttribute('visible', 'true');
                    });
                });
            }
        });
        AFRAME.registerComponent('scene-listener', {
            init: function() {
                const newElement = document.createElement('a-entity');
                newElement.setAttribute('position', '0 -1 -3');
                newElement.setAttribute('rotation', '0 0 0');
                newElement.setAttribute('scale', '0.005 0.005 0.005');
                newElement.setAttribute('visible', 'true');
                newElement.setAttribute('gltf-model', "#" + self.activeObject);
                this.el.appendChild(newElement);
            }
            //update: function() {
            //    this.el.addEventListener('object-clicked', function(event) {
            //        console.log('new position: ', event.detail.newPosition);
            //    });
            //}
        });
        AFRAME.registerComponent('cursor-listener', {
            schema: {
                newPosition: {type: 'number', default: '0 0 0'}
            },
            init: function() {
                const touch = document.createElement('a-entity');
                touch.setAttribute('geometry', 'primitive: cursor')
            },
            update: function () {
                var self = this;
                this.el.addEventListener('click', function (evt) {
                    this.emit('object-clicked', {newPosition: evt.detail.intersection.point}, false);
                    {/*var sceneEl = document.querySelector('a-scene');
                    console.log(sceneEl);
                    var treeEl = document.querySelector('#treeEl');
                    console.log(treeEl);
                    treeEl.setAttribute('position', {x: 1, y: 2, z: -3});*/}
                });
                /* var lastIndex = -1;
                var COLORS = ['red', 'green', 'blue'];
                this.el.addEventListener('click', function (evt) {
                    lastIndex = (lastIndex + 1) % COLORS.length;
                    this.setAttribute('material', 'color', COLORS[lastIndex]);
                }); */
            }
        });
        AFRAME.registerComponent('camera-listener', {
            init: function () {
              this.el.addEventListener('drag', function (evt) {
                //console.log(evt);
              });
            }
        });
        
    }
    handleObjectClick(e) {
        //var objectId = e.target.id;
        //var objectFromParse = this.state.objects[objectId];
        this.activeObject = e.target.id; //objectFromParse.get("sourceUrl");
        //console.log("selected object " + this.activeObject);
    }
    render() {
        
        //console.log(this.state.objects.id);
        return (
            <>
                <a-scene embedded id="main-scene" scene-listener ground-listener style={{ zIndex:0 }}>
                    <a-assets>
                        {/* TODO: add <a-asset-item> tags by mapping the 3d objects stored in "this.state.objects" */}
                        {this.state.objects.map((content) => (
                            <a-asset-item key={ content.id } id={ content.id } src={ DatabaseRequest.GetValue(content, "sourceUrl") } />
                        ))}
                    </a-assets>
                    <a-entity id="main-camera-wrapper" position="0 -1 0" rotation="0 0 0"> 
                        <a-camera id="main-camera" visible="true" cursor="rayOrigin: mouse;" raycaster="objects: .clickable">
                            <a-cursor id="mouse-cursor" color="#4CC3D9" fuse="true" timeout="10" object=".clickable" position="0 0 -1"
                                    rotation="0 0 0" scale="1 1 1" visible="true" repeat="1 1" shader="flat" opacity="1" 
                                    animation__fusing="property: scale; from: 1 1 1; to: 0.1 0.1 0.1; easing: easeInCubic; dur: 1500; startEvents: fusing"
                                    animation__click="property: scale; from: 0.1 0.1 0.1; to: 1 1 1; easing: easeInCubic; dur: 150; startEvents: click" />
                            {/* the component a-animation doesn't work any longer */}
                        </a-camera>
                    </a-entity>
                    {/*<a-entity class=".clickable" id="treeEl" gltf-model="#treeModel" />*/}
                    <a-entity id="ground" className=".clickable" position="0 -2 0"></a-entity>
                    <a-sky color="#d3feba" />
                </a-scene>
                <div style={{ zIndex:1, backgroundColor:'#afafaf', position:'absolute', top:20, left:20, width:500, height:200}}>
                    {this.state.objects.map((content, index) => (
                        <li key={ index } id={ content.id } onClick={ this.handleObjectClick }>Object { DatabaseRequest.GetValue(content, "type") } { DatabaseRequest.GetValue(content, "sourceUrl") }</li>
                    ))}
                </div>
            </>
        );
    }
}

export default ARExperience;