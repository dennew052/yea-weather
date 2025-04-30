import { MMHG_PER_HPA, windDirection, formatVisibility, formatWeatherDate, capitalize } from './helpers.js';
import { WeatherApi } from './services/WeatherApi.js';

const apiKey = '0a376f898eaec5225d4188c8460ce497';
let currentCity = 'Moscow';
const coord = { lat: 55.7522, lon: 37.6156 };
const weatherApi = new WeatherApi(apiKey);

async function getWeather() {
    const loading = document.querySelector('.loading')
    const weather = document.querySelector('.weather')
    try {
        loading.textContent = 'Загрузка...';
        weather.style.visibility = 'hidden';

        const data = await weatherApi.getWeatherByCity(currentCity);
        coord.lat = data.coord.lat;
        coord.lon = data.coord.lon;

        renderCurrentWeather(data);
        loading.textContent = '';
        weather.style.visibility = 'visible';

        await getForecast();
    } catch (err) {
        loading.textContent = 'Ошибка загрузки';
        console.error(err);
    }
}

async function getForecast() {
    try {
        const forecastData = await weatherApi.getForecast(coord.lat, coord.lon);
        const grouped = groupForecastByDay(forecastData.list);
        renderForecastDays(grouped);
    } catch (err) {
        console.error('Ошибка прогноза:', err);
    }
}

function renderCurrentWeather(data) {
    if (data.name) {
        document.querySelector('.weather__city').textContent = data.name;
    }
    document.querySelector('.weather__temperature').textContent = data.main.temp.toFixed(1) + '°C';
    document.querySelector('.weather__desc').textContent = capitalize(data.weather[0].description);
    document.querySelector('.weather__icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.querySelector('.weather__clouds').textContent = 'Облачность: ' + data.clouds.all + '%';
    document.querySelector('.weather__feels-like').textContent = 'Ощущается как ' + data.main.feels_like.toFixed(1) + '°C';
    document.querySelector('.weather__humidity').textContent = 'Влажность: ' + data.main.humidity + '%';
    document.querySelector('.weather__pressure').textContent = 'Давление: ' + Math.round(data.main.pressure * MMHG_PER_HPA) + ' мм. рт. ст';
    document.querySelector('.weather__wind-speed').textContent = `Ветер: ${data.wind.speed} м/с, ${windDirection(data.wind.deg)}`;
    document.querySelector('.weather__visibility').textContent = 'Видимость: ' + formatVisibility(data.visibility);
    document.querySelector('.weather__date').textContent = formatWeatherDate(data.dt);
    if (data.sys) {
        document.querySelector('.weather__date-sunrise').textContent = 'Восход: ' + formatWeatherDate(data.sys.sunrise, 'time');
        document.querySelector('.weather__date-sunset').textContent = 'Закат: ' + formatWeatherDate(data.sys.sunset, 'time');
    } else {
        document.querySelector('.weather__date-sunrise').textContent = '';
        document.querySelector('.weather__date-sunset').textContent = '';
    }
}

function renderForecastDays(days) {
    const container = document.querySelector('.forecast__days');
    const details = document.querySelector('.forecast__details');
    container.innerHTML = '';
    details.innerHTML = '';

    Object.keys(days).forEach((dayLabel, index) => {
        const btn = document.createElement('button');
        btn.className = 'forecast__day-btn';
        btn.textContent = dayLabel;
        if (index === 0) btn.classList.add('active');

        btn.addEventListener('click', () => {
            document.querySelectorAll('.forecast__day-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderForecastDetails(days[dayLabel]);
        });

        container.appendChild(btn);
    });

    renderForecastDetails(days[Object.keys(days)[0]]);
}

function renderForecastDetails(items) {
    const container = document.querySelector('.forecast__details');
    container.innerHTML = '';

    items.forEach(item => {
        const time = new Date(item.dt * 1000).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const li = document.createElement('li');
        li.className = 'forecast__item';
        li.innerHTML = `
             <div><strong>${time}</strong></div>
             <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="">
             <div>${item.main.temp.toFixed(1)}°C</div>
             <div>${item.weather[0].description}</div>
         `;
        container.appendChild(li);

        li.addEventListener('click', () => {
            renderCurrentWeather({
                main: item.main,
                weather: item.weather,
                wind: item.wind,
                clouds: item.clouds,
                visibility: item.visibility,
                dt: item.dt
            });
        });
    });
}

function groupForecastByDay(list) {
    const days = {};
    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
        if (!days[day]) days[day] = [];
        days[day].push(item);
    });
    return days;
}

// Поиск города
document.querySelector('.search-container__form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const input = document.querySelector('.search-container__input');
    const city = input.value.trim();
    const warning = document.querySelector('.search-container__input-wrapper p');

    if (!city) {
        warning.textContent = 'Введите название города';
        return;
    }

    try {
        const cities = await weatherApi.getCityCoordinates(city);
        if (cities.length === 0) {
            warning.textContent = 'Город не найден';
            return;
        }

        warning.textContent = '';
        renderCityList(cities);
    } catch (err) {
        warning.textContent = 'Ошибка при поиске';
        console.error(err);
    }
});

function renderCityList(cities) {
    const list = document.querySelector('.search-container__weather-list');
    list.innerHTML = '';
    list.style.display = 'block';

    cities.forEach(city => {
        const li = document.createElement('li');
        const flag = document.createElement('img');

        flag.src = `https://openweathermap.org/images/flags/${city.country.toLowerCase()}.png`;
        flag.alt = city.country;
        flag.style.width = '24px';
        flag.style.height = '16px';

        const name = document.createElement('span');
        name.textContent = city.name;

        li.appendChild(flag);
        li.appendChild(name);
        li.addEventListener('click', async () => {
            currentCity = city.name;
            list.innerHTML = '';
            list.style.display = 'none';
            document.querySelector('.forecast__days').innerHTML = '';
            document.querySelector('.forecast__details').innerHTML = '';
            await getWeather();
        });

        list.appendChild(li);
    });
}

// Крестик очистки
const input = document.querySelector('.search-container__input');
const clearBtn = document.querySelector('.search-container__clear-btn');
const cityWarning = document.querySelector('.search-container__input-wrapper p');

input.addEventListener('input', () => {
    clearBtn.style.display = input.value ? 'flex' : 'none';
    cityWarning.textContent = '';
});

clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    document.querySelector('.search-container__weather-list').style.display = 'none';
    cityWarning.textContent = '';
    input.focus();
});

getWeather();
