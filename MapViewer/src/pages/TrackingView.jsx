import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate} from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './index.css';
import L from 'leaflet';
import { iconFacEnd, iconFacStart } from './icons';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import mqtt from 'mqtt';
import { Container, Form, Card, Col, Row, Button} from 'react-bootstrap'


const TrackingView = ({config}) => {
  const backendAddress = "http://" +config.db.host + ":" + config.db.port +"/trackingRecent"
  const backendStart = "http://" +config.db.host + ":" + config.db.port +"/startLocation"
  const backendEnd = "http://" +config.db.host + ":" + config.db.port +"/endLocation"
  const wsaddress = 'ws://' + config.mqtt.host + ':' + config.mqtt.port;
  const backend = "http://" +config.db.host + ":" + config.db.port;
  const defaultPositionStart = config.locations[0]
 //{"name": "3D Printing", "LatLong": [50, 0.1]};
  const defaultPositionEnd = config.locations[1]//{"name": "3D Printing", "LatLong": [50, 0.1]};
  const defaultCurrent = config.locations[0].LatLong //[51.495, -0.10];

  let [tracking, setTracking] = useState([]);
  let [positionStart, setPositionStart] = useState(null);
  let [positionEnd, setPositionEnd] = useState(null);
  let [newPositionStart, setNewPositionStart] = useState(null);
  let [newPositionEnd, setNewPositionEnd] = useState(null);
  let [current, setCurrent] = useState(defaultCurrent);
  let [zoom, setZoom] = useState(null);
  let [centerMap, setCenterMap] = useState(null);
  let [method, setMethod] = useState(config.info.infomation_via); // mqtt, db, LoRaWAN
  const [client, setClient] = useState(null);
  

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'http://' + document.location.host,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
  });

  // set mqtt settings up
  if (method == "mqtt" && !client){

    var options = {
      protocol: 'websockets',
      clientId: 'mapOutput', // This can be any unique id
    };
    setClient(mqtt.connect(wsaddress, options));

  }

      if (client && current) {
        client.on('connect', () => {
        });
        client.on('error', (err) => {
          console.error('Connection error: ', err);
          client.end();
        });

        client.on('message', (topic, message) => {
          try{
          var data = JSON.parse(new TextDecoder("utf-8").decode(message))
          //console.log([data.lat, data.lon])
          //console.log(current)
          //handleMessage(data)

          if (current[0] != data.lat && current[1] != data.lon){
          if (data.lat >=-90 && data.lat <= 90 && data.lon >=-180 && data.lon <= 180){
            if (current != null){
              console.log("updated current position")
              console.log([data.lat, data.lon])
              console.log(current)
              if (data.lat_dir && data.lon_dir){
                let dataIn = {"lat": data.lat,"lat_dir": data.lat_dir, "lon": data.lon,"lon_dir": data.lon_dir, "speed":data.speed}
                axios.post(backend, dataIn)
              }else{
                let dataIn = {"lat": data.lat,"lat_dir": 0, "lon": data.lon,"lon_dir": 0, "speed":0}
                axios.post(backend, dataIn)
              }
            }
              const newAr = [data.lat, data.lon]
              const newData = {"name": data.name, "LatLong": newAr}
              setCurrent(newAr);
              setTracking(data);
              

          }
          if (data.start){
            if (data.start.LatLong[0] >=-90 && data.start.LatLong[0] <= 90 && data.start.LatLong[1] >=-180 && data.start.LatLong[1] <= 180){
              setPositionStart(data.start)
            }
          }
          if (data.stop){
            if (data.stop.LatLong[0] >=-90 && data.stop.LatLong[0] <= 90 && data.stop.LatLong[1] >=-180 && data.stop.LatLong[1] <= 180){
              setPositionEnd(data.stop)
            }
          }
        }}catch (error) {
          console.error('MQTT error:', error);
        }
          
       });

         client.subscribe(config.mqtt.topic[0], 2, (error) => {
          if (client) {
            if (error) {
              console.log('Subscribe to topics error', error)
              return
            }
          }
        });
      };

  useEffect(() => {
    if (current ==null){
    fetchLocation();
    }
    fetchData();
  }, []);

  const fetchLocation = async () =>{
    const res = await axios.get(backendAddress);
    //console.log(res)
      if (res.data.length > 0){
        setTracking(res.data);
        setCurrent([res.data[0].LAT, res.data[0].LON]);
      }else{
        console.log("No data found in sqlite")
      }
  }
  const fetchData = async () => {

    try {
      const resS = await axios.get(backendStart)
      
      const tempPosStart = {"name": resS.data[0].NAME, "LatLong": [resS.data[0].LAT, resS.data[0].LON]}
      setPositionStart({"name": resS.data[0].NAME, "LatLong": [resS.data[0].LAT, resS.data[0].LON]})
      setNewPositionStart({"name": resS.data[0].NAME, "LatLong": [resS.data[0].LAT, resS.data[0].LON]})
      //setPositionStart({"name": resS.data.name, "LatLong": [resS.data.lat, resS.data.lon]})
      const resE = await axios.get(backendEnd)
      //if (resE.data.length > 0){
      const tempPosEnd = {"name": resE.data[0].NAME, "LatLong": [resE.data[0].LAT, resE.data[0].LON]}
      setPositionEnd({"name": resE.data[0].NAME, "LatLong": [resE.data[0].LAT, resE.data[0].LON]})
      setNewPositionEnd({"name": resE.data[0].NAME, "LatLong": [resE.data[0].LAT, resE.data[0].LON]})

      if(tempPosEnd && tempPosStart){
        const expanFac = 1.2
        var maxLat_y = Math.max(tempPosEnd.LatLong[0], tempPosStart.LatLong[0], current[0]);
        var minLat_y = Math.min(tempPosEnd.LatLong[0], tempPosStart.LatLong[0], current[0]);
        var maxLon_x = Math.max(tempPosEnd.LatLong[1], tempPosStart.LatLong[1], current[1]);
        var minLon_x = Math.min(tempPosEnd.LatLong[1], tempPosStart.LatLong[1], current[1]);
    
        var zoomCalcy = Math.ceil(18 - Math.sqrt(Math.abs(maxLat_y - minLat_y)*expanFac/0.04))
        var zoomCalcx = Math.ceil(18 - Math.sqrt(Math.abs(maxLon_x - minLon_x)*expanFac/0.04))
        var latCenter = (maxLat_y + minLat_y)/2
        var lonCenter = (maxLon_x + minLon_x)/2
        setZoom(Math.min(zoomCalcy , zoomCalcx))
        setCenterMap([latCenter, lonCenter])
        }
    } catch (error) {
      console.error('Error fetching data:', error);
    }


  };
  

  useEffect(() => {
    const fetchTrack = async () => {
    if (method == "db"){
    const res = await axios.get(backendAddress);
      if (res.data.length > 0){
        setTracking(res.data);
        setCurrent([res.data[0].LAT, res.data[0].LON]);
      }else{
        console.log("No data found in sqlite")
      }
  }
  };
    fetchTrack();
  }, []);


  const handleChangeStart = (e) => {
    setNewPositionStart(config.locations[e.target.value]);
  };

  const handleChangeStop = (e) => {
    setNewPositionEnd(config.locations[e.target.value]);
  };
  const navigate = useNavigate();

  const handleClick = async (e) => {
    e.preventDefault();
    const posStartSend = {"lat": newPositionStart.LatLong[0], "lon": newPositionStart.LatLong[1], "name": newPositionStart.name}
    const possEndSend ={"lat": newPositionEnd.LatLong[0], "lon": newPositionEnd.LatLong[1], "name": newPositionEnd.name};
    try {
      await axios.post(backendStart, posStartSend);
      await axios.post(backendEnd, possEndSend);
      navigate("/");
      window.location.reload(false);
    } catch (err) {
      console.log(err);
      //setError(true)
    }
  };

  // Show current location value in console
  //console.log(zoom);

    return(
    <div >
      <div><Container fluid="md">
      <Card className='mt-2 text-center'>
        <Card.Header as="h1" >Trolly Tracking</Card.Header>
        <Card.Body>
        <Row>
        <Col></Col>
        <Col xs={7}>
          <Card.Title>Live map view</Card.Title>
       
      {zoom != null && centerMap != null && positionStart != null && positionEnd != null &&

      <MapContainer center={centerMap} zoom={zoom} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={positionStart.LatLong} icon={iconFacStart}>
          <Popup>Start position</Popup>
        </Marker>
        <Marker position={positionEnd.LatLong} icon={iconFacEnd}>
          <Popup>End position</Popup>
        </Marker>
        {current != null &&
        <Marker position={current} >
          <Popup>Current position</Popup>
        </Marker>
        }
        
      </MapContainer>
}

Last GPS reading:  Lat = {current != null && <b>{current[0]}, Lon ={current[1]}</b>}

        </Col>
        <Col></Col>
        </Row>
      </Card.Body>
      </Card>
      </Container>
      
      </div>
      <Container fluid="md">
      <Card className='mt-2 text-center'>
        <Card.Body>
    <div>
    <Container>
      <Row>
        <Col></Col>
        <Col>
    <Form>
      <div>
          <label htmlFor="startLocation">Start Location:</label>
          <Form.Group>
          {newPositionStart != null &&
          <Form.Select value={newPositionStart} id = "startLocation" name = "startLocation" onChange={handleChangeStart}>
          <option>{newPositionStart.name}</option>
          {config.locations.map((location, i) => (
            <option key = {i} 
                    name={location.name} 
                    value={i}>{location.name}</option>))}
          </Form.Select>
          }
          </Form.Group>
        </div>
        <div>
          <label htmlFor="endLocation">EndLocation:</label>
          <Form.Group className="mb-3">
          {newPositionEnd != null &&
          <Form.Select value={newPositionEnd} id = "endLocation" name = "endLocation" onChange={handleChangeStop}>
          
          <option>{newPositionEnd.name}</option>
          
          {config.locations.map((location, i) => (
            <option key = {i} 
                    name={location.name} 
                    value={i}>{location.name}</option>))}
          </Form.Select>
          }
          </Form.Group>
        </div>
        <Button type="submit" onClick={handleClick}>Update Start or Stop Locations</Button>
      </Form>
      </Col>
      <Col></Col>
      </Row>
      </Container>
    </div>
      </Card.Body>
      </Card>
    </Container>
      
        
    </div>
  );

};

export default TrackingView;
