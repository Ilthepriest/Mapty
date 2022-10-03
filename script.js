'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  ID = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  setDescription() {
    // Running on April 14
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[[this.date.getMonth()]]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.clacPace();
    this.setDescription();
  }
  clacPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.clacSpeed();
    this.setDescription();
  }
  clacSpeed() {
    this.speed = Math.trunc(this.distance / (this.duration / 60));
    return this.speed;
  }
}

////////////architettura application

class App {
  #map;
  #mapEvent;
  workouts = [];

  constructor() {
    this.getLocalStorage();
    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this.moveToPopup.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Could not get yout position');
      }
    );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    //dopo che la mappa è carica posso renderizzare il local storage
    this.workouts.forEach(el => {
      this.renderWorkoutMarker(el);
    });
  }

  _showForm(eventMap) {
    form.classList.remove('hidden');
    console.log(eventMap);
    this.#mapEvent = eventMap;
    inputDistance.focus();
  }

  hiddenForm() {
    //pulisco i campi di input
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    //prendo i dati e tipo
    const type = inputType.value;
    const dist = +inputDistance.value;
    const dur = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //controllo se i dati sono numeri e positivi
    const isNumber = (...array) => array.every(n => Number.isFinite(n));
    const isPositive = (...array) => array.every(n => n > 0);
    //creo corsa
    if (type === 'running') {
      const cad = +inputCadence.value;
      if (!isNumber(dist, dur, cad) || !isPositive(dist, dur, cad)) {
        return alert('Inserire solo numeri positivi ');
      }
      workout = new Running(dist, dur, [lat, lng], cad);
    }

    //creo biciclettata
    if (type === 'cycling') {
      const elv = +inputElevation.value;
      if (!isNumber(dist, dur, elv) || !isPositive(dist, dur)) {
        return alert('Inserire solo numeri positivi ');
      }
      workout = new Cycling(dist, dur, [lat, lng], elv);
    }

    //aggiungo nuovo workou all'array
    this.workouts.push(workout);
    console.log(workout);
    console.log(this.workouts);

    //renderizzo i workout nella mappa
    this.renderWorkoutMarker(workout);

    //renderizzo i workout nella lista
    this.renderWorkoutList(workout);

    //nascondo il form
    this.hiddenForm();

    //mando i dati al local storage
    this.setLocalStorage();
  }
  //qua passo le coordinate direttamente dal nuovo oggetto workout
  renderWorkoutMarker(work) {
    L.marker(work.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${work.type}-popup`,
        })
      )
      .setPopupContent(
        `${work.type === 'running' ? '🏃' : '🚴‍♀️'} ${work.description}`
      )
      .openPopup();
  }

  renderWorkoutList(work) {
    let html = `
    <li class="workout workout--${work.type}" data-id=${work.ID}>
      <h2 class="workout__title">${work.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          work.type === 'running' ? '🏃' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${work.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${work.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;

    html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${
              work.type === 'running'
                ? work.pace.toFixed(1)
                : work.speed.toFixed(1)
            }</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${
              work.type === 'running' ? work.cadence : work.elevationGain
            }</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  moveToPopup(e) {
    const elClicked = e.target.closest('.workout');
    console.log(elClicked);
    if (!elClicked) return;
    const workID = this.workouts.find(el => el.ID === elClicked.dataset.id);
    console.log(workID);
    this.#map.setView(workID.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    //using public interface
    //quando trasformo in stringa per il local storage mi torna indietro un oggeto normale non l'istanza per cui non ho più i prototipi
    // workID.click();
  }

  setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;
    this.workouts = data;
    data.forEach(el => {
      this.renderWorkoutList(el);
    });
  }

  removeLocalStorage() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
console.log(app);
