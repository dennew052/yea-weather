export class WeatherApi {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    }

    async getWeatherByCity(city) {
        const url = `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric&lang=ru`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
        return await res.json();
    }

    async getForecast(lat, lon) {
        const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=ru`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Ошибка прогноза: ${res.status}`);
        return await res.json();
    }

    async getCityCoordinates(city) {
        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=4&appid=${this.apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Ошибка получения координат');
        return await res.json();
    }
}