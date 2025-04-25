const apiKey = '0a376f898eaec5225d4188c8460ce497'
let city = 'Moscow';
const coord = {
    "lon": 37.6156,
    "lat": 55.7522
};
const MMHG_PER_HPA = 0.75006;

function windDirection(deg) {
    const DIRECTION_COUNT = 8;
    const ANGLE_PER_DIRECTION = 360 / DIRECTION_COUNT;
    const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
    const index = Math.round(deg / ANGLE_PER_DIRECTION) % DIRECTION_COUNT;
    return directions[index];
}

function formatVisibility(visibility) {
    if (visibility >= 1000) {
        return (visibility / 1000).toFixed(1) + ' км';
    } else {
        return visibility + ' м';
    }
}

function formatWeatherDate(dt, mode = 'full') {
    const localTime = new Date(dt * 1000);
    const fullOptions = {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    const timeOnlyOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    const options = mode === 'time' ? timeOnlyOptions : fullOptions;
    return localTime.toLocaleString('ru-RU', options);
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const getWeather = () => {
    document.querySelector('.weather').style.visibility = 'hidden';
    document.querySelector('.loading').textContent = 'Загрузка...'
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
            return response.json();
        })
        .then(data => {
            document.querySelector('.loading').textContent = ''
            document.querySelector('.weather').style.visibility = 'visible';
            document.querySelector('.weather__city').textContent = data.name
            document.querySelector('.weather__temperature').textContent = data.main.temp + '°C'
            document.querySelector('.weather__desc').textContent = capitalize(data.weather[0]['description'])
            document.querySelector('.weather__icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
            document.querySelector('.weather__clouds').textContent = 'Облачность: ' + data.clouds.all + '%'
            document.querySelector('.weather__feels-like').textContent = 'Ощущается как ' + data.main.feels_like + '°C'
            document.querySelector('.weather__humidity').textContent = 'Влажность: ' + data.main.humidity + '%'
            document.querySelector('.weather__pressure').textContent = 'Давление: ' + Math.round(data.main.pressure * MMHG_PER_HPA) + ' мм. рт. ст'
            document.querySelector('.weather__wind-speed').textContent = `Ветер: ${data.wind.speed} м/с, ${windDirection(data.wind.deg)}`
            document.querySelector('.weather__visibility').textContent = 'Видимость: ' + formatVisibility(data.visibility)
            document.querySelector('.weather__date').textContent = formatWeatherDate(data.dt)
            document.querySelector('.weather__date-sunrise').textContent = 'Восход: ' + formatWeatherDate(data.sys.sunrise, 'time')
            document.querySelector('.weather__date-sunset').textContent = 'Закат: ' + formatWeatherDate(data.sys.sunset, 'time')
            coord.lat = data.coord.lat
            coord.lon = data.coord.lon
            getWeatherForAnotherDays()
            return data
        })
        .catch(error => {
            console.error('Ошибка при запросе к OpenWeatherMap:', error);
            return error
        })
        .then(data => {
            return data
        })
}

const getWeatherForAnotherDays = () => {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coord.lat}&lon=${coord.lon}&units=metric&lang=ru&appid=${apiKey}`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const days = {};
            data.list.forEach(item => {
                const date = new Date(item.dt * 1000);
                const day = date.toLocaleDateString('ru-RU', {weekday: 'short', day: 'numeric', month: 'short'});
                if (!days[day]) days[day] = [];
                days[day].push(item);
            });
            renderForecastDays(days);
        })
        .catch(error => {
            console.error('Ошибка при запросе прогноза:', error);
        });
}

function renderForecastDays(days) {
    const forecastDaysContainer = document.querySelector('.forecast__days');
    const forecastDetailsContainer = document.querySelector('.forecast__details');
    forecastDaysContainer.innerHTML = '';
    forecastDetailsContainer.innerHTML = '';

    Object.keys(days).forEach((dayLabel, index) => {
        const btn = document.createElement('button');
        btn.className = 'forecast__day-btn';
        btn.textContent = dayLabel;
        if (index === 0) btn.classList.add('active'); // делаем первый активным по умолчанию

        btn.addEventListener('click', () => {
            document.querySelectorAll('.forecast__day-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderForecastDetails(days[dayLabel]);
        });

        forecastDaysContainer.appendChild(btn);
    });

    // Сразу отрисуем первый день
    const firstDay = Object.keys(days)[0];
    renderForecastDetails(days[firstDay]);
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
            const allItems = Array.from(container.children);
            const index = allItems.indexOf(li);
            document.querySelector('.weather__clouds').textContent = 'Облачность: ' + items[index].clouds.all + '%'
            document.querySelector('.weather__date').textContent = formatWeatherDate(items[index].dt)
            document.querySelector('.weather__feels-like').textContent = 'Ощущается как ' + items[index].main.feels_like + '°C'
            document.querySelector('.weather__humidity').textContent = 'Влажность: ' + items[index].main.humidity + '%'
            document.querySelector('.weather__pressure').textContent = 'Давление: ' + Math.round(items[index].main.pressure * MMHG_PER_HPA) + ' мм. рт. ст'
            document.querySelector('.weather__temperature').textContent = items[index].main.temp + '°C'
            document.querySelector('.weather__visibility').textContent = 'Видимость: ' + formatVisibility(items[index].visibility)
            document.querySelector('.weather__desc').textContent = capitalize(items[index].weather[0]['description'])
            document.querySelector('.weather__wind-speed').textContent = `Ветер: ${items[index].wind.speed} м/с, ${windDirection(items[index].wind.deg)}`
            document.querySelector('.weather__icon').src = `https://openweathermap.org/img/wn/${items[index].weather[0].icon}@2x.png`
            document.querySelector('.weather__date-sunrise').textContent = ''
            document.querySelector('.weather__date-sunset').textContent = ''
        })
    });
}

getWeather()

document.querySelector('.search-container__form').addEventListener('submit', function (e) {
    e.preventDefault();
    city = document.querySelector('.search-container__input').value.trim();
    const cityNotFound = document.querySelector('.search-container__input-wrapper p')

    // Проверка, если поле ввода пустое
    if (!city) {
        cityNotFound.textContent = 'Введите название города';
        return;
    }
    cityNotFound.textContent = ''
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=4&appid=${apiKey}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка запроса');
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                const cityNotFound = document.querySelector('.search-container__input-wrapper p');
                cityNotFound.textContent = 'Город не найден';
                return;
            }
            const list = document.querySelector('.search-container__weather-list');
            list.innerHTML = '';
            data.forEach(city => {
                const li = document.createElement('li');

                // Изображение флага страны
                const flag = document.createElement('img');
                flag.src = `https://openweathermap.org/images/flags/${city.country.toLowerCase()}.png`;
                flag.alt = city.country;
                flag.style.width = '24px';
                flag.style.height = '16px';

                // Текст названия города
                const cityName = document.createElement('span');
                cityName.textContent = city.name;
                li.appendChild(flag);
                li.appendChild(cityName);
                list.appendChild(li);
                list.style.display = 'block';
            });

            // Кликаем по городу в поиске
            const items = document.querySelectorAll('.search-container__weather-list li');
            items.forEach((item, index) => {
                item.addEventListener('click', () => {
                    list.innerHTML = '';
                    list.style.display = 'none';
                    document.querySelector('.forecast__days').innerHTML = '';
                    document.querySelector('.forecast__details').innerHTML = '';
                    getWeather()
                });
            });
        })
        .catch(error => {
            console.error('Ошибка:', error);
        });
});

const input = document.querySelector('.search-container__input');
const clearBtn = document.querySelector('.search-container__clear-btn');

// Показываем или скрываем крестик
input.addEventListener('input', () => {
    clearBtn.style.display = input.value ? 'flex' : 'none';
});

// Очистка поля при клике
clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    input.focus();
    document.querySelector('.search-container__weather-list').style.display = 'none';
});
