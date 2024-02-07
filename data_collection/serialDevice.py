import serial
from datetime import datetime
import time
import tomli
import json
from sqliteConnect import sqliteConnect
import paho.mqtt.client as mqtt
from datetime import datetime
import requests

class SerialGPSconnect:
    def __init__(self, portIn, typeIn, baudrate):
        self.ser = serial.Serial(portIn, baudrate = baudrate, timeout = 10)
        self.type = typeIn

    def parseGPS(self, data):
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
                    lat = self.decode(sdata[3]) #latitude
                    dirLat = sdata[4]      #latitude direction N/S
                    lon = self.decode(sdata[5]) #longitute
                    dirLon = sdata[6]      #longitude direction E/W
                    speed = sdata[7]       #Speed in knots
                    trCourse = sdata[8]    #True course
                    date = sdata[9][0:2] + "/" + sdata[9][2:4] + "/" + sdata[9][4:6]#date
                    
                    output = [lat, dirLat, lon, dirLon, speed, trCourse, date, time]
                except:
                    print("Error")
                    output = None
        return output

    def parseGNSS(self,data):
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
                    lat = self.decode(sdata[3]) #latitude
                    dirLat = sdata[4]      #latitude direction N/S
                    lon = self.decode(sdata[5]) #longitute
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

    def decode(self, coord):
        #Converts DDDMM.MMMMM > DD deg MM.MMMMM min
        x = coord.split(".")
        head = x[0]
        tail = x[1]
        deg = head[0:-2]
        min = head[-2:]
        return deg + " deg " + min + "." + tail + " min"

    def runCollection(self):
        x = True
        while  x:
            data = self.ser.readline()
                    #print "raw:", data #prints raw data
            try:
                data = data.decode("utf-8")
            except:
                data = ""
            if data != None and ("$GNRMC" in data or "$GPRMC" in data):
                if "$GNRMC" in data:
                    output = self.parseGNSS(data)
                elif "$GPRMC" in data:
                    output = self.parseGPS(data)
                else:
                    output = None
                x =True
                if output != None:

                    dataBaseFormat = {}
                    dataBaseFormat["latitude"] = output["latitude"]
                    dataBaseFormat["longtitude"] = output["longtitude"]
                    dataBaseFormat["speed"] = output["speed"]
                    return dataBaseFormat 
                else:
        
                    return None

       

    
        
        
        