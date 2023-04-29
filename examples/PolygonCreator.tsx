import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

import MapView, {MAP_TYPES, Marker, Polygon} from 'react-native-maps';
import { Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import flagBlueImg from './assets/flag-blue.png';
import { isFunctionExpression } from 'typescript';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = -6.0;
const LONGITUDE = -36.0;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
let id = 0;


var isCreating = false;


log = console.log;


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

      log('-----------')
      log(editing)
      log(newPolygons)

      newPolygons[editing.polyId].coordinates = editing.coordinates;
      this.setState({
        polygons: [...polygons],
      });


    }
    this.setState({
      creating: null,
      editing: null,
    });

  }



  onPress(e: any) {

    if (!isCreating)
      return;

    const {creating, editing} = this.state;




    if (!creating) {
      this.setState({
        creating: {
          id: id++,
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

    if (this.state.creating) {
      mapOptions.scrollEnabled = false;
      mapOptions.onPanDrag = (e: any) => this.onPress(e);
    }


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
              key={polygon.id}
              coordinates={polygon.coordinates}
              strokeColor="#F00"
              fillColor="rgba(255,255,0,0.5)"
              strokeWidth={1}
              tappable={true}
            />
          ))}


          {this.state.creating && (
            <Polygon
              key={this.state.creating.id}
              coordinates={this.state.creating.coordinates}
              strokeColor="#000"
              fillColor="rgba(255,0,0,0.5)"
              strokeWidth={1}
            />
          )}


          {this.state.editing && (
            <Polygon
              key={this.state.editing.polyId}
              coordinates={this.state.editing.coordinates}
              strokeColor="#000"
              fillColor="rgba(255,0,100,0.5)"
              strokeWidth={1}
            />
          )}




        { this.state.creating && this.state.creating.coordinates.map((coord: any, i:Int32) => (

          <Marker
          coordinate={coord}
          onSelect={e => {

            log('select', e.nativeEvent.coordinate);

          }}
          onDrag={e => {
            newCoordinates[i] = e.nativeEvent.coordinate;
            this.state.creating.coordinates = newCoordinates;
            this.setState({
              creating: {
                coordinates: [...this.state.creating.coordinates],
              },
            });
          }}
          onDragStart={e => { 
            newCoordinates = [...this.state.creating.coordinates];

            newCoordinates[i] = e.nativeEvent.coordinate;
            this.state.creating.coordinates = newCoordinates;

            this.setState({
              creating: {
                coordinates: [...this.state.creating.coordinates],
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
          anchor={{x: 0.65, y: 0.95}}>
            

          </Marker>



        ))}










          { this.state.editing && this.state.editing.coordinates.map((coord: any, i:Int32) => (

          <Marker
          coordinate={coord}
          onSelect={e => {

            log('select', e.nativeEvent.coordinate);

          }}
          onDrag={e => {
            newCoordinates[i] = e.nativeEvent.coordinate;
            this.state.editing.coordinates = newCoordinates;
            this.setState({
              editing: { 
                ...this.state.editing,
                coordinates: [...this.state.editing.coordinates],
              },
            });
          }}
          onDragStart={e => { 
            newCoordinates = [...this.state.editing.coordinates];

            newCoordinates[i] = e.nativeEvent.coordinate;
            this.state.editing.coordinates = newCoordinates;

            this.setState({
              editing: {
                ...this.state.editing,
                coordinates: [...this.state.editing.coordinates],
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
          anchor={{x: 0.65, y: 0.95}}>
            

          </Marker>



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
          { (!isCreating && (!this.state.editing)) && (
            <TouchableOpacity
              onPress={() => {
                isCreating = true;
              } }
              style={[styles.bubble, styles.button]}>
              <Text>Create</Text>
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
