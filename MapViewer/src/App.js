import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route, Switch } from "react-router-dom";
//import { Container, Card, Spinner} from 'react-bootstrap';
import TrackingView from "./pages/TrackingView";
//import EditLocation from "./pages/EditLocation"
//<Route exact path="/editLocations" element={<EditLocation />} />
import APIBackend from './RestAPI'
import React from 'react';
import { Container, Form, Card, Col, Row, Button, Modal, Table, Spinner, InputGroup, DropdownButton, Dropdown } from 'react-bootstrap'

function App() {
  let [loaded, setLoaded] = React.useState(false)
  let [pending, setPending] = React.useState(false)
  let [error, setError] = React.useState(null)
  let [config, setConfig] = React.useState([])

  React.useEffect(() => {
    let do_load = async () => {
      setPending(true)
      let response = await APIBackend.api_get('http://' + document.location.host + '/config/config.json');
      if (response.status === 200) {
        const raw_conf = response.payload;
        console.log("config", raw_conf)
        setConfig(raw_conf)
        setLoaded(true)
      } else {
        console.log("ERROR LOADING CONFIG")
        setError("ERROR: Unable to load configuration!")
      }
    }
    if (!loaded && !pending) {
      do_load()
    }
  }, [loaded, pending])
  
  if (!loaded) {
    return  (<h1>Loading Config</h1>)
  } else {
  return (
    
      <BrowserRouter>
      <div>
          <Routes>
            <Route exact path="/" element={<TrackingView config={config}/>}/>
          </Routes>
      </div>
      </BrowserRouter>
    
  );
}
}

export default App;
