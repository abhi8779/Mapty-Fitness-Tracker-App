'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; //in Km
    this.duration = duration; // in mins
  }
  _setDescription() {
    // prettier-ignore

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()} `;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadance) {
    super(coords, distance, duration, cadance);
    this.cadance = cadance;
    this.clacPace();
    this._setDescription();
  }
  clacPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elivation) {
    super(coords, distance, duration, elivation);
    this.elivation = elivation;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycle1 = new Cycling([39, -12], 50, 95, 520);
// console.log(run1);
// console.log(cycle1);

//APPLICATION AECHITECTURE---------------------------------------------------------------

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workout = [];

  constructor() {
    //get users position
    this._getPosition();

    //get data from local storage
    this._getLocalStorage();

    //Attach event handlers

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('⚠️Could not get your position');
        }
      );
    }
  }

  _loadMap(POSITION) {
    const { latitude, longitude } = POSITION.coords;
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    //Handeling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workout.forEach(wrk => this._renderWorkoutMarker(wrk));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //Clearing input
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    setTimeout(() => (form.style.display = 'grid'), 1000);

    form.classList.add('hidden');
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const positiveInputs = (...inputs) => inputs.every(inp => inp > 0);

    //get data from the  form

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //if activity running create running object
    if (type === 'running') {
      const cadance = +inputCadence.value;

      //check if data is valid
      if (
        !validInputs(distance, duration, cadance) ||
        !positiveInputs(distance, duration, cadance)
      )
        return alert('⚠️inputs have to be positive numbers!');

      workout = new Running([lat, lng], duration, duration, cadance);
    }

    //if activity cycling create cycling object
    if (type === 'cycling') {
      const elivationGain = +inputElevation.value;
      // console.log(elivationGain);
      if (
        !validInputs(distance, duration, elivationGain) ||
        !positiveInputs(distance, duration)
      )
        return alert('⚠️inputs have to be positive numbers!');
      workout = new Cycling([lat, lng], duration, duration, elivationGain);
    }
    // add new object to workout array
    this.#workout.push(workout);
    // console.log(this.#workout);

    //Render workout on list

    this._renderWorkout(workout);
    // render workout on map as marker
    this._renderWorkoutMarker(workout);

    //Clearing input fields
    this._hideForm();

    //set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }),
        'Running'
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚴‍♀️'} ${workout.discription}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    // console.log(workout);
    const emoji = workout.type === 'running' ? '🏃' : '🚴‍♀️';
    let html = `
  <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.discription}</h2>
    <div class="workout__details">
      <span class="workout__icon">${emoji}</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;
    if (workout.type === 'running') {
      html += `
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadance}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>
  `;
    }
    if (workout.type === 'cycling') {
      html += `
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elivation}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>
  `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const WorkoutEl = e.target.closest('.workout');
    if (!WorkoutEl) return;

    const workout = this.#workout.find(
      work => work.id === WorkoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
    // console.log(workout);
    // workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    // console.log(data);
    if (!data) return;
    this.#workout = data;

    this.#workout.forEach(wrk => this._renderWorkout(wrk));
  }
  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
}

const app = new App();
