
import L from 'leaflet';
import './index.css';

const iconFacEnd = new L.Icon({
    iconUrl: 'http://' + document.location.host,
    iconRetinaUrl: require('./img/factoryEnd.png'),
    iconSize: new L.Point(60, 75),
});

const iconFacStart = new L.Icon({
    iconUrl: 'http://' + document.location.host,
    iconRetinaUrl: require('./img/factoryStart.png'),
    iconSize: new L.Point(60, 75),
});

const iconOld = new L.Icon({
    iconUrl: 'http://' + document.location.host,
    iconRetinaUrl: require('./img/block.png'),
    iconSize: new L.Point(20, 20),
});

export { iconFacEnd, iconFacStart, iconOld};