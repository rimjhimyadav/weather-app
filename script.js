const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");
const message = document.getElementById("message");
const weatherBox = document.getElementById("weather");

// api gives a number for the weather, this converts it
function getWeatherInfo(code) {
  if (code === 0) return { text: "Clear sky", icon: "☀️" };
  if (code <= 2) return { text: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { text: "Cloudy", icon: "☁️" };
  if (code <= 48) return { text: "Foggy", icon: "🌫️" };
  if (code <= 57) return { text: "Drizzle", icon: "🌦️" };
  if (code <= 67) return { text: "Rain", icon: "🌧️" };
  if (code <= 77) return { text: "Snow", icon: "❄️" };
  if (code <= 82) return { text: "Rain showers", icon: "🌧️" };
  if (code <= 86) return { text: "Snow showers", icon: "🌨️" };
  return { text: "Thunderstorm", icon: "⛈️" };
}

function showMessage(text, isError) {
  message.textContent = text;
  if (isError) {
    message.classList.add("error");
  } else {
    message.classList.remove("error");
  }
}

async function searchCity() {
  const city = cityInput.value.trim();
  if (city === "") {
    showMessage("Please enter a city name", true);
    return;
  }

  showMessage("Loading...", false);
  weatherBox.classList.add("hidden");

  try {
    // get lat and lon of the city first
    const url = "https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + city;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results) {
      showMessage("City not found", true);
      return;
    }

    const place = data.results[0];
    getWeather(place.latitude, place.longitude, place.name + ", " + place.country);
    localStorage.setItem("lastCity", city);
  } catch (error) {
    showMessage("Something went wrong", true);
  }
}

async function getWeather(lat, lon, name) {
  showMessage("Loading...", false);

  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" + lat +
      "&longitude=" + lon +
      "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&timezone=auto&forecast_days=6";

    const response = await fetch(url);
    const data = await response.json();

    showWeather(data, name);
    showMessage("", false);
  } catch (error) {
    showMessage("Could not load the weather", true);
  }
}

function showWeather(data, name) {
  const info = getWeatherInfo(data.current.weather_code);

  document.getElementById("city-name").textContent = name;
  document.getElementById("icon").textContent = info.icon;
  document.getElementById("temp").textContent = Math.round(data.current.temperature_2m) + "°C";
  document.getElementById("description").textContent = info.text;
  document.getElementById("humidity").textContent = data.current.relative_humidity_2m + "%";
  document.getElementById("wind").textContent = data.current.wind_speed_10m + " km/h";

  const forecast = document.getElementById("forecast");
  forecast.innerHTML = "";

  // i = 1 because 0 is today
  for (let i = 1; i < data.daily.time.length; i++) {
    const date = new Date(data.daily.time[i]);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dayInfo = getWeatherInfo(data.daily.weather_code[i]);
    const max = Math.round(data.daily.temperature_2m_max[i]);
    const min = Math.round(data.daily.temperature_2m_min[i]);

    const div = document.createElement("div");
    div.className = "day";

    const dayText = document.createElement("p");
    dayText.textContent = dayName;

    const icon = document.createElement("p");
    icon.className = "day-icon";
    icon.textContent = dayInfo.icon;

    const temp = document.createElement("p");
    temp.className = "day-temp";
    temp.innerHTML = max + "° <span class='day-min'>" + min + "°</span>";

    div.appendChild(dayText);
    div.appendChild(icon);
    div.appendChild(temp);
    forecast.appendChild(div);
  }

  weatherBox.classList.remove("hidden");
}

function useMyLocation() {
  if (!navigator.geolocation) {
    showMessage("Location not supported", true);
    return;
  }

  showMessage("Getting your location...", false);

  navigator.geolocation.getCurrentPosition(
    function (position) {
      getWeather(position.coords.latitude, position.coords.longitude, "Your location");
    },
    function (error) {
      if (error.code === 1) {
        showMessage("Location permission denied", true);
      } else {
        showMessage("Could not get your location", true);
      }
    },
    { timeout: 10000 } // stop waiting after 10 seconds
  );
}

searchBtn.onclick = searchCity;
locationBtn.onclick = useMyLocation;

cityInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    searchCity();
  }
});

// load last city
const lastCity = localStorage.getItem("lastCity");
if (lastCity) {
  cityInput.value = lastCity;
  searchCity();
}
