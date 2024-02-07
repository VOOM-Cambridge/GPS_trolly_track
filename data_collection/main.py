import serial
from datetime import datetime
import time
import tomli
import json
from sqliteConnect import sqliteConnect
import paho.mqtt.client as mqtt
from datetime import datetime
import requests

from deadReckoning import SparkplugHatDead 
from serialDevice import SerialGPSconnect

def formatDataSQLite(data):
    output ={}
    output["lat"] = data["latitude"]
    output["direction lat"] =0
    output["lon"] =data["longtitude"] 
    output["direction lon"] = 0
    output["speed"] =data["speed"]
    return output

def formatDataMQTT(output):
    return {output["latitude"], 0, output["longtitude"], 0, output["speed"]} 


def mqtt_send(payload, topic, config, client):
    payload["timestamp"]= str(datetime.now())
    mess_send = json.dumps(payload)
    print(payload)
    #client.connect(config['broker'], config["port"])
    time.sleep(0.1)
    client.publish(topic, mess_send, config["qos"], config["retainLast"])

def data_add_sqlite(data, method):
    dataout = formatDataSQLite(data)
    if methodSQL == "fileLocal":
        newConnection = sqliteConnect(config)
        newConnection.connect() 
    else: # method is api
        x = requests.post(api, dataBaseFormat)

if __name__ == '__main__':
    with open("config/config.toml", "rb") as f:
        toml_conf = tomli.load(f)

    #gps connection
    methodGPS = toml_conf["constant"]["harware"]
    port_gps = toml_conf['constant']["gps"]['port']
    frequency = toml_conf['constant']['freq']

    # create connection to database and make if it doesn't exist
    configSQL = toml_conf['sqlite3']
    methodSQL = toml_conf["sqlite3"]["method"]
    if methodSQL == "fileLocal":
        newConnection = sqliteConnect(config)
        newConnection.connect() 
    else: # method is api
        api = toml_conf["sqlite3"]["path"]

    # mqtt connection
    portMQTT = toml_conf['mqtt']['port']
    brokerMQTT = toml_conf['mqtt']['broker']
    configMQTT = toml_conf['mqtt']
    topicMQTT = "delivery_tracking/" + toml_conf['constant']['name']
    
    client = mqtt.Client("trolly_gps")
    client.connect(brokerMQTT, portMQTT)


    # print(output)
    # mqtt_send(output, topic, config)
                
    latLast = 0
    lonLast = 0
    timeLast = datetime.now()

    

    if methodGPS == "usb_device" or "max_GNSS":
        SerialGPSconnect = SerialGPSconnect(port_gps, "GNSS", 9600)
    elif methodGPS == "sparkplug_hat_dead":
        deadReckoning = SparkplugHatDead(port_gps)


    while True:
        if (datetime.now() - timeLast).total_seconds() > frequency:
            try:
                if methodGPS == "usb_device" or "max_GNSS":
                    data = SerialGPSconnect.runCollection()
                elif methodGPS == "sparkplug_hat_dead":
                    data = deadReckoning.runGPS()
                    

                if data != None:
                    print(data)
                    mqtt_send(data, topicMQTT, configMQTT, client)
                    data_add_sqlite(data, methodSQL)
                    
                    latLast = data["latitude"]
                    lonLast = data["longtitude"]
                else:
                    print("no data")
                    mqtt_send({"lat": latLast, "lon": lonLast}, topicMQTT, configMQTT, client)
                
                timeLast = datetime.now()

            except Exception as err:
                print(err)   