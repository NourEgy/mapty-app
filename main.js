"use strict";

///////////////////////////////////////
const year = document.querySelector("#year");
const date = new Date();

year.innerHTML = date.getFullYear();

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    getDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}${this.date.getDate()}`;
    }
}

class Running extends Workout {
    type = "running"
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this.getDescription();
    }

    calcPace() {
        // Min/km
        this.pace = this.duration / this.distance;
        return this.pace; 
    }
}

class Cycling extends Workout {
    type = "cycling"
    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);
        this.elevation = elevation;
        this.calcSpeed();
        this.getDescription();
    }
    // km/h
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }

}

// const runing1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 578);
// console.log(runing1, cycling1);


/////////////////////////////////////
// APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const restartAll = document.querySelector('.restart');
const messages = document.querySelector(".message");

// Constructor Functions
class App {
    // Previte Property
    #map;
    #currentPosition;
    #mapZoomLevel = 13;
    #mapEvent;
    #workout = [];
    #marker;
    #layers = [];



    // Constructor Properties
    constructor() {
        this.getPosition();
        
        // Form Submit
        form.addEventListener("submit", this.newWorkout.bind(this));

        // Input Select
        inputType.addEventListener("change", this.toggleElevationFiuld);

        // container Workouts
        containerWorkouts.addEventListener("click", this.workoutsContainer.bind(this));

        // Rest all
        restartAll.addEventListener("click", this.deleteAllItemsLocalStorage.bind(this));

        // getLocalStorage
        this.getLocalStorage();
        
        // Welcome to App
        this.newFeature();
    }

    // Method Get Position
    getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this.loadMap.bind(this), this.errorMap);
        }
    }

    // Method loadMap
    loadMap(position) {
        // User Position
        const {latitude} = position.coords;
        const {longitude} = position.coords;
        //const myLocation = `https://www.google.pt/maps/@${latitude},${longitude}`;
        const coords = [latitude, longitude];
        // LeftMap
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Handler Event From L
        this.#map.on("click", this.showForm.bind(this));

        // Set Market Map
        this.#workout.forEach(work => {
            this.renderWorkoutMarker(work);
        });


        // Current position
        this.#currentPosition = L.marker(coords);
        this.#currentPosition.addTo(this.#map)
        .bindPopup(L.popup({
            minWidth: 100,
            maxWidth: 250,
            autoClose: false,
            closeOnClick: false,
        }));
        

        // Display Message
        this.message("Welcome", "success");
    }


    // showForm
    showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
    }

    // hide form
    hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add("hidden");
        setTimeout( () => form.style.display = 'grid', 1000);
    }

    // Method ErrorMap
    errorMap() {
        console.log("this is no location");
    }

    // newWorkout
    newWorkout(e) {
        e.preventDefault();

        // Valid Inputs
        const validInputs = (...inputs) => inputs.every(input => Number.isFinite(input));
        const allPositive = (...inputs) => inputs.every(input => input > 0);


         // get Data From Form
         const type = inputType.value;
         const distance = +inputDistance.value;
         const duration = +inputDuration.value;
         const {lat, lng} = this.#mapEvent.latlng;
         let workout;

         // If work Running - Create Running Objet
         if (type === "running") {
            const cadence = +inputCadence.value;
            if (// !Number.isFinite(distance) ||
                // !Number.isFinite(Duration) ||
                // !Number.isFinite(cadence)
                !validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence) ) {
                return alert("Inputs Have To be Positive Numbers!");
            }
            workout = new Running([lat, lng], distance, duration, cadence);
         }


         // If work cycling - Create cycling Objet
         if (type === "cycling") {
            const elevation = +inputElevation.value;
            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration)) {
                return alert("Inputs Have To be Positive Numbers!");
            }
            workout = new Cycling([lat, lng], distance, duration, elevation);
         }  
 

         // Add New Object To workout Array
         this.#workout.push(workout);


         // Render Workout as Map Marker
         this.renderWorkoutMarker(workout);

         // Render Workout
         this.renderWorkout(workout);
        
        // HideForm
        this.hideForm();

        // SetTolocal Storage
        this.setLocalStroage();

        // Display Message
        this.message("Item Added!", "success");
    }

     // Toggle Fiulds
     toggleElevationFiuld() {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }


    renderWorkoutMarker(workout) {
        // const type = inputType.value;
       //console.log(workout)
        this.#marker = L.marker(workout.coords);

        this.#layers.push(this.#marker);

        this.#marker.addTo(this.#map)
        .bindPopup(L.popup({
            minWidth: 100,
            maxWidth: 250,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
        }))
        .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
        .openPopup();
        
    }
    
    renderWorkout(workout) {
        let html = `
        <li class="item-workout">
        <button class="delete-workout" data-delete="${workout.id}">x</button>
        <div class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
            </div>     
        `;

        if ( workout.type === "running" ) {
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence} </span>
                <span class="workout__unit">spm</span>
                </div>
            </div>
            </li>`;
        }

        if ( workout.type === "cycling" ) {
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.elevation} </span>
                <span class="workout__unit">spm</span>
                </div>
            </div>
            </li>`;
        }

        form.insertAdjacentHTML("afterend", html);
    }




    setLocalStroage() {
        localStorage.setItem("workout", JSON.stringify(this.#workout));
    }

    getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workout'))
        if(!data) return;
        this.#workout = data;

        this.#workout.forEach(work => {
            this.renderWorkout(work);
        });
    }
    
    // Heandler Function Event
    workoutsContainer(e) {

         // Move to Maker
        this.moveToMarker(e);

         // 2 Delete Workout
         // Delete Item From Local And Element
         this.deleteItemLocalStorage(e);


    }

    // // Move to Maker
    moveToMarker(e) {
        const workoutEl = e.target.closest(".workout");
        if (workoutEl) {
            let workout = this.#workout.find(work => work.id === workoutEl.dataset.id);
            console.log(workout);
            this.#map.setView(workout.coords, this.#mapZoomLevel, {
                animate: true,
                pan: {
                    duration: 1,
                },
            });
            //workout.clicks++; 
        };
    }

    // Delete item
    deleteItemLocalStorage(e) {
        const deleteItem = e.target.closest(".delete-workout");
        if(!deleteItem) return;

         // Display Message
         this.message("item remove", "danger");

        // Btn id
        const id = deleteItem.dataset.delete;
        const data = JSON.parse(localStorage.getItem('workout'))
        if(!data) return;        
        this.#workout = data;
        this.#workout = this.#workout.filter((work, i) => {
            if (id !== work.id) {
                return work;
            } else {
                // Remove Marker
                this.#layers[i].remove(); // Remove element By index
                this.#layers.splice(i, 1);
            }
        });
        // Remove Item
        const element = deleteItem.parentElement; 
        containerWorkouts.removeChild(element);
        // Set LocalStorage
        this.setLocalStroage();
        //localStorage.setItem("workout", JSON.stringify(this.#workout));

       
    }


    // Delete All Items 
    // Delete All Workouts
    deleteAllItemsLocalStorage() {
        const allItems = document.querySelectorAll(".item-workout");
        // Remove all Elements
        if (allItems.length > 0) {
            allItems.forEach(item => {
                containerWorkouts.removeChild(item);
            });
        }
        // Remove All Marker map
       this.#layers.forEach((item) => {
            item.remove();
        })
        // Remove From LocalStorage
        localStorage.removeItem("workout");
        // Reload Page
        location.reload();
    }


    // message
    message(text, action) {
        messages.innerHTML = `${text}`;
        messages.classList.add(`${action}`);
        setTimeout(() => {
            messages.classList.remove(`${action}`);
        }, 1200);
    }
    
    newFeature() {
        console.log("Welcome to Application");
    }

}

const app = new App();


