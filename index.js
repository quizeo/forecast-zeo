import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
const port = 3000;
const API_URL  = "http://api.openweathermap.org";
const API_KEY = "2f586ce65f4692030b5750925f6f4dc6";



app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); 

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res) => {
    res.render("index.ejs", {  location:" Input now" });
});

app.post("/forecast", async (req, res) => {
    try {
        const loc = req.body.location;
        const url = `${API_URL}/geo/1.0/direct?q=${loc}&limit=1&appid=${API_KEY}`;
        const result = await axios.get(url);
        console.log(result.data);

        if (result.data.length > 0) {
            const locationData = result.data[0];
            const lat = locationData.lat.toFixed(2);
            const lon = locationData.lon.toFixed(2);

            let weatherData = await getWeatherData(lat, lon);
            let weatherArray = [];
            const currentTime = new Date().getTime() / 1000; // Current time in seconds
            const isNight = currentTime < weatherData.sys.sunrise || currentTime > weatherData.sys.sunset;
            const timezone = weatherData.timezone;
            const localTime = new Date((currentTime + timezone) * 1000).toLocaleTimeString('en-US', { timeZone: 'UTC' });

            weatherData.weather.forEach(w => {
                const iconSuffix = isNight ? 'n' : 'd';
                const icon = `http://openweathermap.org/img/wn/${w.icon.slice(0, -1)}${iconSuffix}@2x.png`;
                weatherArray.push({
                    description: w.description,
                    icon: icon,
                    temp: weatherData.main.temp
                });
            });
            console.log("Current Temp:", weatherData.main.temp);

            res.render("index", { location: `Latitude: ${lat}, Longitude: ${lon}`, weatherData: weatherArray, isNight, locationName: loc, time: localTime});
        } else {
            res.render("index", { location: "Location not found", weatherData: [], isNight: false, locationName: loc, time: "" });
        }
    } catch (error) {
        console.error("Error fetching weather data:", error);
        res.render("index", { location: "Error fetching data", weatherData: [], isNight: false, locationName: loc, time: ""  });
    }
});


async function getWeatherData(lat, lon) {
    try {
        const result = await axios.get(`${API_URL}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        return result.data;
    } catch (error) {
        console.error("Error fetching weather data:", error);
        throw error;
    }
}