import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate} from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './index.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import mqtt from 'mqtt';
import { Container, Form, Card, Col, Row, Button} from 'react-bootstrap'
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { iconFacEnd, iconFacStart , iconOld} from './icons';
// import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css'; // Re-uses images from ~leaflet package
// import 'leaflet-defaulticon-compatibility';
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const TrackingView = ({config}) => {
  const backendAddress = "http://" +config.db.host + ":" + config.db.port +"/trackingRecent"
  const backendStart = "http://" +config.db.host + ":" + config.db.port +"/startLocation"
  const backendEnd = "http://" +config.db.host + ":" + config.db.port +"/endLocation"
  const backendFind = "http://" +config.db.host + ":" + config.db.port +"/trackingTime/"
  const wsaddress = 'ws://' + config.mqtt.host + ':' + config.mqtt.port;
  const backend = "http://" +config.db.host + ":" + config.db.port;
  const defaultPositionStart = config.locations[0]
 //{"name": "3D Printing", "LatLong": [50, 0.1]};
  const defaultPositionEnd = config.locations[1]//{"name": "3D Printing", "LatLong": [50, 0.1]};
  const defaultCurrent = config.locations[0].LatLong //[51.495, -0.10];
  const defaultCentre = [52.20934355, 0.0873595];
  const defualtZoom = 18;


  let [tracking, setTracking] = useState([]);
  let [positionStart, setPositionStart] = useState()//(fetchInitalStart);
  let [positionEnd, setPositionEnd] = useState()//(fetchInitalEnd);
  let [current, setCurrent] = useState()//(fetchInitalCurrent)  
  let [newPositionStart, setNewPositionStart] = useState(null);
  let [newPositionEnd, setNewPositionEnd] = useState(null);
  let [zoom, setZoom] = useState(null);
  let [centerMap, setCenterMap] = useState(null);
  let [method, setMethod] = useState(config.info.infomation_via); // mqtt, db, LoRaWAN
  let [history, setHistory] = useState(null);
  //const [client, setClient] = useState(null);
  let [timeOut, setTimeOut] = useState(0);
  let [polyData, setPolyData] = useState(null);
  const [clientMQTT, setClientMQTT] = useState(null);
  const [mapOn, setMapOn] = useState(null);


  const storeData = async() =>{
    if(current != null){
      let dataIn = {"lat": current[0],"lat_dir": 0, "lon": current[1],"lon_dir": 0, "speed":0}
      const res = await axios.get(backendAddress).then((res) => {
        if (res.data.length > 0){
          // data exisits in database so check agianst it
          if ((current[0] !== res.data[0].LAT) && (current[1] !== res.data[0].LON)){
            // data different to last location recorded - record new onw
            console.log("new location");
            axios.post(backend, dataIn)
          }
        } else {
          axios.post(backend, dataIn)
        }
      });
    }};

    const fetchData = async () => {
    try {
      const resS = await axios.get(backendStart)
      const resCurr = await axios.get(backendAddress)
      const resE = await axios.get(backendEnd)
      
      const tempPosStart = {"name": resS.data[0].NAME, "LatLong": [resS.data[0].LAT, resS.data[0].LON]}
      setPositionStart({"name": resS.data[0].NAME, "LatLong": [resS.data[0].LAT, resS.data[0].LON]})
      setNewPositionStart({"name": resS.data[0].NAME, "LatLong": [resS.data[0].LAT, resS.data[0].LON]})
      //setPositionStart({"name": resS.data.name, "LatLong": [resS.data.lat, resS.data.lon]})
      //if (resE.data.length > 0){
      const tempPosEnd = {"name": resE.data[0].NAME, "LatLong": [resE.data[0].LAT, resE.data[0].LON]}
      setPositionEnd({"name": resE.data[0].NAME, "LatLong": [resE.data[0].LAT, resE.data[0].LON]})
      setNewPositionEnd({"name": resE.data[0].NAME, "LatLong": [resE.data[0].LAT, resE.data[0].LON]})
      const tempCurr = [resCurr.data[0].LAT, resCurr.data[0].LON]
      console.log("test test test")
      console.log({current: tempCurr, epos: tempPosEnd, spos: tempPosStart})
      if(tempPosEnd && tempPosStart && tempCurr){
        const expanFac = 1.2
        var maxLat_y = Math.max(tempPosEnd.LatLong[0], tempPosStart.LatLong[0], tempCurr[0]);
        var minLat_y = Math.min(tempPosEnd.LatLong[0], tempPosStart.LatLong[0], tempCurr[0]);
        var maxLon_x = Math.max(tempPosEnd.LatLong[1], tempPosStart.LatLong[1], tempCurr[1]);
        var minLon_x = Math.min(tempPosEnd.LatLong[1], tempPosStart.LatLong[1], tempCurr[1]);
        var zoomCalcy = Math.ceil(18 - Math.sqrt(Math.abs(maxLat_y - minLat_y)*expanFac/0.04));
        var zoomCalcx = Math.ceil(18 - Math.sqrt(Math.abs(maxLon_x - minLon_x)*expanFac/0.04));
        var latCenter = (maxLat_y + minLat_y)/2;
        var lonCenter = (maxLon_x + minLon_x)/2;
        console.log([latCenter, lonCenter])
        console.log(Math.min(zoomCalcy , zoomCalcx))
        setZoom(Math.min(zoomCalcy , zoomCalcx))
        setCenterMap(() => [latCenter, lonCenter])
        
        console.log([latCenter, lonCenter])
        } else if (tempPosEnd && tempPosStart){
          const expanFac = 1.2
          var maxLat_y = Math.max(tempPosEnd.LatLong[0], tempPosStart.LatLong[0]);
          var minLat_y = Math.min(tempPosEnd.LatLong[0], tempPosStart.LatLong[0]);
          var maxLon_x = Math.max(tempPosEnd.LatLong[1], tempPosStart.LatLong[1]);
          var minLon_x = Math.min(tempPosEnd.LatLong[1], tempPosStart.LatLong[1]);
          var zoomCalcy = Math.ceil(18 - Math.sqrt(Math.abs(maxLat_y - minLat_y)*expanFac/0.04));
          var zoomCalcx = Math.ceil(18 - Math.sqrt(Math.abs(maxLon_x - minLon_x)*expanFac/0.04));
          var latCenter = (maxLat_y + minLat_y)/2;
          var lonCenter = (maxLon_x + minLon_x)/2;
          console.log([latCenter, lonCenter])
          console.log(Math.min(zoomCalcy , zoomCalcx))
          setZoom(Math.min(zoomCalcy , zoomCalcx))
          setCenterMap(() => [latCenter, lonCenter])
        } else {
          console.error('no fetching data:');
          setZoom(18)
          setCenterMap(defaultCurrent)
        }
    } catch (error) {
      console.error('Error fetching data:', error);
      setZoom(18)
      setCenterMap(defaultCentre)
    }
    console.log("end")

  };

    useEffect(()=>{

    console.log("update current done, check ..")
    if (current != null && current != undefined){
      console.log(current)
      console.log("running")
      storeData()
      fetchData()
    } 
  }, [current]);



  useEffect(() => { 


  const proccessMess = async(message) =>{
    // try to process the mqtt messeage
      try{
      // check data a valid current
          var data = JSON.parse(new TextDecoder("utf-8").decode(message))
          console.log(data)
          console.log(current)
          console.log("********")
          if (data.coords.latitude >=-90 && data.coords.latitude <= 90 && data.coords.longitude >=-180 && data.coords.longitude <= 180){
            const newAr = [data.coords.latitude, data.coords.longitude]
            const newData = {"name": data.name, "LatLong": newAr}
            let dataIn = {"lat": data.coords.latitude,"lat_dir": data.lat_dir, "lon": data.coords.longitude,"lon_dir": data.lon_dir, "speed":data.speed}
            setCurrent(newAr);
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
        }catch (error) {
          console.error('MQTT error:', error);
        };

      }

    const fetchLocation = async () =>{
    const res = await axios.get(backendAddress).then((res) => {
    //console.log(res)
      if (res.data.length > 0){
        let curr = {"name": "current", "LatLong": [res.data[0].LAT, res.data[0].LON]}
        setCurrent([res.data[0].LAT, res.data[0].LON]);
        
        console.log(current)
      }else{
        console.log("No data found in sqlite")
        let dat = defaultCurrent;
        let curr = {"name": "current", "LatLong": dat}
        setCurrent(dat);
        //setTracking(curr);
        
      }
    });
  };

  try{
    fetchLocation()
    if (method == "mqtt" ){
    var options = {
        protocol: 'websockets',
        clientId: 'mapOutput', // This can be any unique id
      };
    const client = mqtt.connect(wsaddress, options);
    setClientMQTT(client)

    client.on('connect', () => {
        client.subscribe(config.mqtt.topic[0], 2);
        //console.log("Connected to cleint")
    });

    client.on('message', (topic, message) => {
      proccessMess(message);
   });
    //fetchCurrent()
    //fetchLocation();
    }
    
  } catch {
    fetchData()
  }

  }, []);


  const handleChangeTime = (e) => {
    setTimeOut(e.target.value);
  };

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




  const handleHistory = async (e) => {
    e.preventDefault()
    console.log(timeOut)
    let querry = backendFind + "?value=" + timeOut.toString()
    const res = await axios.get(querry);
    console.log(res)
      if (res.data.length > 0){
        setHistory(res.data);
        polyFind(res.data);
      }else{
        setHistory(null);
      }
  }
  
  const limeOptions = { color: 'black' }

  const polyFind = (data) => {
    
    let finalArrayStart = [];
    let finalArrayEnd = [];
    let len = data.length;
    for (let i = 1; i < len-1; i++) {
      finalArrayStart.push([data[i-1].LAT, data[i-1].LON]);
      finalArrayEnd.push([data[i].LAT, data[i].LON]);
    }
    let multiPolyline = [finalArrayStart, finalArrayEnd];
    setPolyData(multiPolyline);
    console.log(multiPolyline);
  }


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
       
      {zoom !== null && centerMap !== null && zoom !== undefined && centerMap !== undefined && 
      <MapContainer center={centerMap} zoom={zoom} scrollWheelZoom={false} style={{ height: "500px"}}>
        <TileLayer attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {positionEnd !== null && positionEnd !== undefined && 
        <Marker position={positionStart.LatLong} icon={iconFacStart}>
          <Popup>Start position</Popup>
        </Marker>
        }
        {positionStart !== null && positionStart !== undefined && 
        <Marker position={positionEnd.LatLong} icon={iconFacEnd}>
          <Popup>End position</Popup>
        </Marker>
        }

        {(current !== null || current !== undefined )&&
        <Marker key = "0" position={current} >
          <Popup>Current position</Popup>
        </Marker>
        }

        {history !== null && (
          <>
            {history.map((item, i) => (
              <Marker key={i} position={[item.LAT, item.LON]} icon={iconOld}>
                <Popup>{item.TIME_LAST_ACTION}</Popup>
              </Marker>
              
            ))}
          </>
        )}
      {history !== null && 
      <Polyline pathOptions={limeOptions} positions={polyData} />
      }
      </MapContainer>
}
  {current != null &&  <>Last GPS reading:  <b>Lat = {current[0]}, Lon ={current[1]}</b></>}
  {current == null &&  <> <b> Waiting for first data to be sent</b></>}
  
        </Col>
        <Col>
        <form onSubmit={handleHistory}>
          <label>
            Number of readings needed:
            <input
              type="number"
              value={timeOut}
              onChange={handleChangeTime}
              required
            />
          </label>
          <button type="submit">Submit</button>
        </form>
        <div>Showing: {timeOut}</div>
        </Col>
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
          {newPositionStart !== null && newPositionStart.name &&
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
          {newPositionEnd !== null && newPositionEnd.name &&
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
