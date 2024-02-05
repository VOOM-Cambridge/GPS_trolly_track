import serial
from datetime import datetime
import time
import tomli
import json
from sqliteConnect import sqliteConnect
import paho.mqtt.client as mqtt
from datetime import datetime
import requests


def parseGPS(data):
    #print "raw:", data #prints raw data
    try:
        data = data.decode("utf-8")
    except:
        data = ""
    output = None
    if "$GPRMC" in data:
        print(data)
        sdata = data.split(",")
        if sdata[2] == 'V':
            print("no satellite data available")
            output = None
        else:
            print("---Parsing GPRMC---")
            try:
                time = sdata[1][0:2] + ":" + sdata[1][2:4] + ":" + sdata[1][4:6]
                lat = decode(sdata[3]) #latitude
                dirLat = sdata[4]      #latitude direction N/S
                lon = decode(sdata[5]) #longitute
                dirLon = sdata[6]      #longitude direction E/W
                speed = sdata[7]       #Speed in knots
                trCourse = sdata[8]    #True course
                date = sdata[9][0:2] + "/" + sdata[9][2:4] + "/" + sdata[9][4:6]#date
                
                output = [lat, dirLat, lon, dirLon, speed, trCourse, date, time]
            except:
                print("Error")
                output = None
    return output

def parseGNSS(data):
    #print "raw:", data #prints raw data
    try:
        data = data.decode("utf-8")
    except:
        data = ""
    output = None
    if "$GNRMC" in data:
        print(data)
        sdata = data.split(",")
        if sdata[2] == 'V':
            print("no satellite data available")
            output = None
        else:
            print("---Parsing GPRMC---")
            try:
                time = sdata[1][0:2] + ":" + sdata[1][2:4] + ":" + sdata[1][4:6]
                lat = decode(sdata[3]) #latitude
                dirLat = sdata[4]      #latitude direction N/S
                lon = decode(sdata[5]) #longitute
                dirLon = sdata[6]      #longitude direction E/W
                speed = sdata[7]       #Speed in knots
                trCourse = sdata[8]    #True course
                date = sdata[9][0:2] + "/" + sdata[9][2:4] + "/" + sdata[9][4:6]#date
                output ={}
                output["latitude"] = lat
                output["direction lat"] =dirLat
                output["longtitude"] =lon 
                output["direction lon"] = dirLon
                output["speed"] =speed
            except:
                print("Error")
                output = None
    return output

            #print("time : %s, latitude : %s(%s), longitude : %s(%s), speed : %s, True Course : %s, Date : %s" %  (time,lat,dirLat,lon,dirLon,speed,trCourse,date))

def decode(coord):
    #Converts DDDMM.MMMMM > DD deg MM.MMMMM min
    x = coord.split(".")
    head = x[0]
    tail = x[1]
    deg = head[0:-2]
    min = head[-2:]
    return deg + " deg " + min + "." + tail + " min"

def mqtt_send(payload, topic, config):
    payload["timestamp"]= str(datetime.now())
    mess_send = json.dumps(payload)
    print(payload)
    client.connect(broker, port)
    time.sleep(0.1)
    client.publish(topic, mess_send, config["mqtt"]["qos"], config["mqtt"]["retainLast"])


if __name__ == '__main__':
    with open("config/config.toml", "rb") as f:
        toml_conf = tomli.load(f)

    port_gps = toml_conf['constant']['port']
    # create connection to database and make if it doesn't exist
    config = toml_conf['sqlite3']
    method = toml_conf["sqlite"]["method"]
    if config["method"] == "fileLocal":
        newConnection = sqliteConnect(config)
        newConnection.connect() 
    else: # method is api
        api = toml_conf["sqlite"]["path"]

    port = toml_conf['mqtt']['port']
    broker = toml_conf['mqtt']['brokerIP']
    topic = "delivery_tracking/" + toml_conf['constant']['name']
    typeGPS = toml_conf['constant']['type']
    
    client = mqtt.Client("trolly_gps")

    ser = serial.Serial(port_gps, baudrate = 9600, timeout = 10)
    print("Connected to device")
    if(ser.isOpen() == False):
        ser.open()
    #ser.flushInput()
    lastreading = [0, 0, 0, 0]
    timeLast = datetime.now()
    while True:
        
        data = ser.readline()
        try:
            if typeGPS == "GNSS":
                output = parseGPS(data)
            elif typeGPS == "GPS":
                output = parseGNSS(data)
            else:
                output = parseGPS(data)
            # put data in a format that can be read
            dataBaseFormat = {output["latitude"], output["direction lat"], output["longtitude"], output["direction lon"], output["speed"]}
            if output != None:
                print("Recieved Data ")         
                print(output)
                lastReading = output
                print(output)
                mqtt_send(output, topic, config)
                # post to database api if backend server running
                data
                if method == "api":
                    x = requests.post(api, dataBaseFormat)
                else:
                    newConnection.addNew(dataBaseFormat )
        except Exception:
            print(Exception)
            
        ser.flushInput()
       
       
