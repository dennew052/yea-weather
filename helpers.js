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