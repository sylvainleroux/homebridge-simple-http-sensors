const axios = require('axios');
let Service, Characteristic;

module.exports = (api) => {
  api.registerAccessory('HttpTemperatureHumidity', HttpTemperatureHumidity);
  Service = api.hap.Service;
  Characteristic = api.hap.Characteristic;
};

class HttpTemperatureHumidity {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.temperature = 20;
    this.humidity = 50;
    this.ambientLightLevel = 1000;

    this.log.info('HttpTemperatureHumidity Plugin Loaded');

    this.url = config.url;
    this.updateInterval = config.updateInterval || 60000; // Default update interval is 60 seconds

    this.temperatureService = new Service.TemperatureSensor(this.name);
    this.temperatureService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getTemperature.bind(this));

    this.humidityService = new Service.HumiditySensor(this.name);
    this.humidityService
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', this.getHumidity.bind(this));

    this.lightSensorService = new Service.LightSensor(this.name);
    this.lightSensorService
      .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
      .on('get', this.getCurrentAmbientLightLevel.bind(this));

    // Fetch initial values and schedule periodic updates
    this.fetchData();
    setInterval(this.fetchData.bind(this), this.updateInterval);
  }

  async fetchData() {
    try {
      const response = await axios.get(this.url);
      const data = response.data;
      this.temperature = Number(data.temperature_celcius);
      this.humidity = Number(data.humidity_percent);
      this.ambientLightLevel = Number(data.lux);

      this.temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .updateValue(this.temperature);

      this.humidityService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .updateValue(this.humidity);

      this.lightSensorService
        .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .updateValue(this.ambientLightLevel);
    } catch (error) {
      this.log('Error fetching data: ', error);
    }
  }

  getTemperature(callback) {
    callback(null, this.temperature);
  }

  getHumidity(callback) {
    callback(null, this.humidity);
  }

  getCurrentAmbientLightLevel(callback) {
    callback(null, this.ambientLightLevel);
  }

  getServices() {
    return [
      this.temperatureService,
      this.humidityService,
      this.lightSensorService,
    ];
  }
}
