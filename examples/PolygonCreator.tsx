// TODO: make marker transparent on creating state (aparently iOS can do it but android dont...)
// TODO: when editing, consolidate polygon on onDragEnd to allow move more than one marker in the same edit section
// TODO: avoid creating marker on drag

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

import MapView, {LocalTile, MAP_TYPES, Marker, Polygon} from 'react-native-maps';
import { Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import flagBlueImg from './assets/marker.png';
//import { createModuleResolutionCache, isFunctionExpression } from 'typescript';

import { getAreaOfPolygon, getDistance } from 'geolib';


const {width, height} = Dimensions.get('window');

const PRECISION = 2
const ASPECT_RATIO = width / height;
const LATITUDE = -5.8464;
const LONGITUDE = -35.2037;
const LATITUDE_DELTA = 0.000922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

var ID = 0;

var isCreating = false;
var isJoining = false;

log = console.log;



function findIdForPolyId(newPolygons, polyId) {
  var id = 0;
  for (let localId in newPolygons) {
    if (newPolygons[localId].id == polyId) id = localId
  }

  return id;
}


function computeAreaNutela(coordinates:any) {

  let radius = 6371000;

  let XY = coordinates.map( (coord:any) => [coord.latitude , coord.longitude] )

  return getAreaOfPolygon(XY)

}

function computeAreaChuckNorris(coordinates:any) {

  let radius = 6371000;

  let XY = coordinates.map( (coord:any) => [Math.PI*coord.latitude*radius/180.0 , Math.cos(coord.latitude*Math.PI/180.0)*coord.longitude*Math.PI*radius/180.0] )


  var area = 0.0;
  for (let id=0; id< XY.length; id++) {


    let roundId = (id+1)%XY.length;

    let previousY = XY[id][0];
    let previousX = XY[id][1];   

    let currentY = XY[roundId][0];
    let currentX = XY[roundId][1];

    area += (currentY+previousY)*(currentX-previousX)/2.0;

  }

  return Math.abs(area);

}


let computeArea = computeAreaChuckNorris;
//let computeArea = computeAreaNutela;



function computeCenter(coordinates:any) {
  var latCenter = 0.0;
  var longCenter = 0.0;

  for (let coordId in coordinates) {
    latCenter += coordinates[coordId].latitude;
    longCenter += coordinates[coordId].longitude;
  }
  latCenter /= coordinates.length;
  longCenter /= coordinates.length;

  let res = {"latitude":latCenter, "longitude":longCenter};


  return res;
}



class PolygonCreator extends React.Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      polygons: [],
      creating: null,
      editing: null,
    };
  }

  finish() {

    if (isCreating) {

      const {polygons, creating} = this.state;

      this.setState({
        polygons: [...polygons, creating],
      });

      isCreating = false;
    } else {

      const {polygons, editing} = this.state;
      let newPolygons = [...polygons]

      let polyId = findIdForPolyId(newPolygons, editing.polyId);

      newPolygons[polyId].coordinates = editing.coordinates;

      this.setState({
        polygons: [...newPolygons],
      });

    }


    this.setState({
      creating: null,
      editing: null,
    });

  }


  delete() {

    const {polygons, editing} = this.state;
    let newPolygons = [...polygons]


    let polyId = findIdForPolyId(newPolygons, editing.polyId);

    newPolygons.splice(polyId,1);


    this.setState({
      polygons: [...newPolygons],
    });


    this.setState({
      creating: null,
      editing: null,
    });

  }




  onPress(e: any) {

    const {creating, editing} = this.state;

    if (!isCreating || editing)
      return;


    if (!creating) {
      this.setState({
        creating: {
          id: ID++,
          coordinates: [e.nativeEvent.coordinate],
        },
      });
    } else {
    
      this.setState({
        creating: {
          ...this.state.creating,
          coordinates: [...creating.coordinates, e.nativeEvent.coordinate],
        },
      });
    }

  }




  render() {
    const mapOptions: any = {
      scrollEnabled: true,
    };

//    if (this.state.creating) {
      //mapOptions.scrollEnabled = false;
      //mapOptions.onPanDrag = (e: any) => this.onPress(e);
//    }

    let createMarker = (coord:any, creatingOrEditing:string, creatingOrEditingObj:any, i:int32) => (

          <Marker
          coordinate={coord}
          onSelect={e => {

            log('select', e.nativeEvent.coordinate);

          }}

          onDrag={e => {
            var newCoordinates = [...creatingOrEditingObj.coordinates];

            newCoordinates[i] = e.nativeEvent.coordinate;
            this.setState({
              [creatingOrEditing]: {
                ...creatingOrEditingObj,
                coordinates: [...newCoordinates],
              },
            });
          }}

          onDragStart={e => { 
            var newCoordinates = [...creatingOrEditingObj.coordinates];

            newCoordinates[i] = e.nativeEvent.coordinate;

            this.setState({
              [creatingOrEditing]: {
                ...creatingOrEditingObj,
                coordinates: [...newCoordinates],
              },
            });

            log('drawStart', e.nativeEvent.coordinate);

          }}
          onDragEnd={e => {

            log('dragEnd', e.nativeEvent.coordinate);

          }}
          onPress={e => {
            log('press', e.nativeEvent.coordinate);

          }}
          draggable
          image={flagBlueImg}
          anchor={{x: 0.5, y: 0.5}}>
            

        </Marker>
    )


    let renderCurrentPolygon = (cratingOrEditingObj:any, color:string) => (
      <Polygon
      key={cratingOrEditingObj.id}
      coordinates={cratingOrEditingObj.coordinates}
      strokeColor="#000"
      fillColor={color}
      strokeWidth={1}
      />
    )


    let renderPolygon = (polygon:any) => (
      <Polygon
        onPress={ (e:any)=>{  

        isCreating = false;

        this.setState({
          editing: {
            coordinates: [...polygon.coordinates],
            polyId : polygon.id
          },
          creating : null
        });


      } }
      key={'p'+polygon.id}
      coordinates={polygon.coordinates}
      strokeColor="#F00"
      fillColor="rgba(255,255,0,0.5)"
      strokeWidth={1}
      tappable={true}
    >


      </Polygon>  
    )

    let renderPolygonMarker = (polygon:any) => (
      <Marker
      key={'m'+polygon.id}
      coordinate={computeCenter(polygon.coordinates)}
        tappable={false}>

          <Text 
          key={'t'+polygon.id}
          style={{
                fontWeight: 'bold',
                color: 'white',
            }} 
            tappable={false}>
            {"area = \n" + computeArea(polygon.coordinates).toFixed(PRECISION)}
          </Text>


      </Marker>

    );






    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          mapType={MAP_TYPES.HYBRID}
          initialRegion={this.state.region}
          onPress={e => this.onPress(e)}
          {...mapOptions}>

          {this.state.polygons.map((polygon: any) => (
            renderPolygon(polygon)
          ))}

          {this.state.polygons.map((polygon: any) => (
            renderPolygonMarker(polygon)
          ))}

          {this.state.creating && 
            renderCurrentPolygon(this.state.creating, "rgba(55,0,255,0.5)")
          }

          {this.state.editing && 
            renderCurrentPolygon(this.state.editing, "rgba(55,0,100,0.5)")
          }

          {this.state.editing && 
            renderPolygonMarker({"coordinates" : this.state.editing.coordinates})
          }

          {this.state.creating && this.state.creating.coordinates.map((coord: any, i:Int32) => (
            createMarker(coord, "creating", this.state.creating, i)
          ))}

          {this.state.editing && this.state.editing.coordinates.map((coord: any, i:Int32) => (
            createMarker(coord, "editing", this.state.editing, i)
          ))} 
       </MapView>


       <View style={styles.buttonContainer}>
          {(this.state.creating || this.state.editing)&& (
            <TouchableOpacity
              onPress={() => this.finish()}
              style={[styles.bubble, styles.button]}>
              <Text>Finish</Text>
            </TouchableOpacity>
          )}
          {(this.state.editing) && (
            <TouchableOpacity
              onPress={() => this.delete()}
              style={[styles.bubble, styles.button]}>
              <Text>Delete</Text>
            </TouchableOpacity>
          )}
          { (!isCreating && (!this.state.editing)) && (
            <TouchableOpacity
              onPress={() => {
                isCreating = true;
              } }
              style={[styles.bubble, styles.button]}>
              <Text>Create</Text>
            </TouchableOpacity>
          )}
          { this.state.polygons && (this.state.polygons.length >= 2) && (!this.state.editing) && (!isCreating) && (
            <TouchableOpacity
              onPress={() => {
                isJoining = true;
              } }
              style={[styles.bubble, styles.button]}>
              <Text>Join</Text>
            </TouchableOpacity>
          )}
          { (
            <TouchableOpacity
              onPress={() => {
                
                d1 = getDistance(this.state.polygons[0].coordinates[0], this.state.polygons[0].coordinates[1])
                d2 = getDistance(this.state.polygons[0].coordinates[1], this.state.polygons[0].coordinates[2])

                log(d1)
                log(d2)
                

              } }
              style={[styles.bubble, styles.button]}>
              <Text>poly</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    );
  }
}





const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  latlng: {
    width: 200,
    alignItems: 'stretch',
  },
  button: {
    width: 80,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
});

export default PolygonCreator;
