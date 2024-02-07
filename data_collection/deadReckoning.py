
# Example 3
# This example sets up the serial port and then passes it to the UbloxGPs
# library. From here we call veh_attitude() to get the 
# the data received is "valid" which indicates that the probability of the time
# to be correct is very high. 

import serial

from ublox_gps import UbloxGps


# port = serial.Serial('/dev/ttyAMA0', baudrate=38400, timeout=1)
# gps = UbloxGps(port)


class SparkplugHatDead:
    def __init__(self, portIn, frequency):
        self.serialConnection = serial.Serial(portIn, baudrate=38400, timeout=1)
        self.freq = frequency
        self.gps = UbloxGps(self.serialConnection)

    def runDead(self):
        print("Listening for UBX Messages")
        while True:
            try:
                veh = self.gps.veh_attitude()
                data = {}
                data["Roll"] = veh.roll
                data["Pitch"]: veh.pitch
                data["Heading"]:veh.heading
                data["Heading Accel"]: veh.accHeading
                return data
                # print("Roll: ", veh.roll)
                # print("Pitch: ", veh.pitch)
                # print("Heading: ", veh.heading)
                # print("Roll Acceleration: ", veh.accRoll)
                # print("Pitch Acceleration: ", veh.accPitch)
                # print("Heading Acceleration: ", veh.accHeading)
            except (ValueError, IOError) as err:
                print(err)
    
    def runGPS(self):
        print("Listening for UBX Messages")
        while True:
            try:
                geo = self.gps.geo_coords()
                data = {}
                data["latitude"] = geo.lon
                data["longtitude"] = geo.lat
                data["Heading"] =  geo.headMot
                return data
                # print("Longitude: ", geo.lon) 
                # print("Latitude: ", geo.lat)
                # print("Heading of Motion: ", geo.headMot)
            except (ValueError, IOError) as err:
                print(err)
