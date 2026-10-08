/* =========================================================
   AIRCRAFT SEAT BOOKING & MANAGEMENT SYSTEM
   Professional JavaScript Version
   ========================================================= */

"use strict";

/* =========================
   CONFIGURATION
   ========================= */

const ROWS = 30;
const COLS = 6;
const MAX_SELECTIONS = 20;

const SEAT_LETTERS = ["A", "B", "C", "D", "E", "F"];


/* =========================
   DSA DATA STRUCTURES
   ========================= */

// 2D Array - Aircraft seats
const aircraft = [];

// Linked List - Booking records
class BookingNode {
    constructor(id, passengerName, phone, seatNumber, fare) {
        this.bookingID = id;
        this.passengerName = passengerName;
        this.phone = phone;
        this.seatNumber = seatNumber;
        this.fare = fare;
        this.next = null;
    }
}

let bookingHead = null;

// Stack - Undo seat selection
const selectionStack = [];

// Queue - Waiting list
const waitingQueue = [];

let nextBookingID = 1001;


/* =========================
   DOM HELPERS
   ========================= */

function $(id) {
    return document.getElementById(id);
}

function getElement(...ids) {
    for (const id of ids) {
        const element = $(id);

        if (element) {
            return element;
        }
    }

    return null;
}


/* =========================
   INITIALIZE AIRCRAFT
   ========================= */

function initializeAircraft() {
    aircraft.length = 0;

    for (let row = 0; row < ROWS; row++) {
        const rowSeats = [];

        for (let col = 0; col < COLS; col++) {
            const rowNumber = row + 1;

            rowSeats.push({
                seatNumber: `${rowNumber}${SEAT_LETTERS[col]}`,
                type: getSeatType(col),
                booked: false,
                selected: false,
                bulkhead: rowNumber === 1,
                exitRow: rowNumber === 12 || rowNumber === 13,
                price: getSeatPrice(rowNumber, col)
            });
        }

        aircraft.push(rowSeats);
    }
}


/* =========================
   SEAT TYPE
   ========================= */

function getSeatType(col) {
    if (col === 0 || col === 5) {
        return "Window";
    }

    if (col === 2 || col === 3) {
        return "Aisle";
    }

    return "Middle";
}


/* =========================
   SEAT PRICE
   ========================= */

function getSeatPrice(row, col) {
    let price = 100;

    if (col === 0 || col === 5) {
        price += 20;
    }

    if (col === 2 || col === 3) {
        price += 15;
    }

    if (row === 1) {
        price += 50;
    }

    if (row === 12 || row === 13) {
        price += 60;
    }

    return price;
}


/* =========================
   FIND SEAT
   ========================= */

function getSeat(seatNumber) {
    if (!seatNumber) {
        return null;
    }

    const normalized = seatNumber.trim().toUpperCase();

    const match = normalized.match(/^(\d+)([A-F])$/);

    if (!match) {
        return null;
    }

    const row = parseInt(match[1], 10);
    const letter = match[2];

    if (row < 1 || row > ROWS) {
        return null;
    }

    const col = SEAT_LETTERS.indexOf(letter);

    if (col === -1) {
        return null;
    }

    return aircraft[row - 1][col];
}


/* =========================
   DISPLAY AIRCRAFT
   ========================= */

function displayAircraft() {
    const container = getElement(
        "seatMap",
        "aircraftMap",
        "seat-map",
        "aircraft-map"
    );

    if (!container) {
        console.warn("Seat map container not found.");
        return;
    }

    container.innerHTML = "";

    aircraft.forEach((rowSeats, rowIndex) => {
        const rowElement = document.createElement("div");

        rowElement.className = "seat-row";

        const rowNumber = document.createElement("div");

        rowNumber.className = "row-number";
        rowNumber.textContent = rowIndex + 1;

        rowElement.appendChild(rowNumber);

        rowSeats.forEach((seat, colIndex) => {
            const seatButton = document.createElement("button");

            seatButton.type = "button";
            seatButton.className = "seat";

            seatButton.dataset.seat = seat.seatNumber;

            seatButton.textContent = seat.seatNumber;

            if (seat.booked) {
                seatButton.classList.add("booked");
                seatButton.disabled = true;
            } else if (seat.selected) {
                seatButton.classList.add("selected");
            } else {
                seatButton.classList.add("available");
            }

            if (seat.bulkhead) {
                seatButton.classList.add("bulkhead");
            }

            if (seat.exitRow) {
                seatButton.classList.add("exit-row");
            }

            seatButton.title =
                `${seat.seatNumber} • ${seat.type} • $${seat.price.toFixed(2)}`;

            seatButton.addEventListener("click", () => {
                toggleSeat(seat.seatNumber);
            });

            rowElement.appendChild(seatButton);

            // Aircraft aisle after C
            if (colIndex === 2) {
                const aisle = document.createElement("div");
                aisle.className = "aisle";
                rowElement.appendChild(aisle);
            }
        });

        container.appendChild(rowElement);
    });

    updateSelectedCount();
    updateTotalFare();
}


/* =========================
   SELECT / DESELECT SEAT
   ========================= */

function toggleSeat(seatNumber) {
    const seat = getSeat(seatNumber);

    if (!seat) {
        showMessage("Invalid seat number.", "error");
        return;
    }

    if (seat.booked) {
        showMessage("This seat is already booked.", "error");
        return;
    }

    if (seat.selected) {
        seat.selected = false;

        const index = selectionStack.indexOf(seat.seatNumber);

        if (index !== -1) {
            selectionStack.splice(index, 1);
        }

        showMessage(`${seat.seatNumber} removed from selection.`, "info");
    } else {
        if (selectionStack.length >= MAX_SELECTIONS) {
            showMessage(
                `Maximum ${MAX_SELECTIONS} seats can be selected.`,
                "error"
            );
            return;
        }

        seat.selected = true;
        selectionStack.push(seat.seatNumber);

        showMessage(`${seat.seatNumber} selected.`, "success");
    }

    displayAircraft();
}


/* =========================
   UNDO LAST SELECTION
   ========================= */

function undoSelection() {
    if (selectionStack.length === 0) {
        showMessage("There is no selected seat to undo.", "error");
        return;
    }

    const seatNumber = selectionStack.pop();
    const seat = getSeat(seatNumber);

    if (seat) {
        seat.selected = false;
    }

    displayAircraft();

    showMessage(
        `Selection of ${seatNumber} has been undone.`,
        "success"
    );
}


/* =========================
   CLEAR ALL SELECTIONS
   ========================= */

function clearSelections() {
    selectionStack.forEach(seatNumber => {
        const seat = getSeat(seatNumber);

        if (seat) {
            seat.selected = false;
        }
    });

    selectionStack.length = 0;

    displayAircraft();

    showMessage("All selections have been cancelled.", "info");
}


/* =========================
   BOOK SELECTED SEATS
   ========================= */

function bookSelectedSeats() {
    if (selectionStack.length === 0) {
        showMessage("Please select at least one seat.", "error");
        return;
    }

    const nameInput = getElement(
        "passengerName",
        "passenger-name",
        "name"
    );

    const phoneInput = getElement(
        "passengerPhone",
        "passenger-phone",
        "phone"
    );

    const passengerName = nameInput
        ? nameInput.value.trim()
        : prompt("Enter passenger name:");

    const phone = phoneInput
        ? phoneInput.value.trim()
        : prompt("Enter phone number:");

    if (!passengerName) {
        showMessage("Passenger name is required.", "error");
        return;
    }

    if (!phone) {
        showMessage("Phone number is required.", "error");
        return;
    }

    const seatsToBook = [...selectionStack];

    seatsToBook.forEach(seatNumber => {
        const seat = getSeat(seatNumber);

        if (!seat || seat.booked) {
            return;
        }

        seat.booked = true;
        seat.selected = false;

        addBooking(
            passengerName,
            phone,
            seat.seatNumber,
            seat.price
        );
    });

    selectionStack.length = 0;

    if (nameInput) {
        nameInput.value = "";
    }

    if (phoneInput) {
        phoneInput.value = "";
    }

    displayAircraft();
    displayBookings();
    updateStatistics();

    showMessage(
        `${seatsToBook.length} seat(s) booked successfully.`,
        "success"
    );
}


/* =========================
   LINKED LIST - ADD BOOKING
   ========================= */

function addBooking(
    passengerName,
    phone,
    seatNumber,
    fare
) {
    const newBooking = new BookingNode(
        nextBookingID++,
        passengerName,
        phone,
        seatNumber,
        fare
    );

    if (bookingHead === null) {
        bookingHead = newBooking;
        return;
    }

    let current = bookingHead;

    while (current.next !== null) {
        current = current.next;
    }

    current.next = newBooking;
}


/* =========================
   GET BOOKINGS ARRAY
   ========================= */

function getBookingsArray() {
    const bookings = [];

    let current = bookingHead;

    while (current !== null) {
        bookings.push(current);
        current = current.next;
    }

    return bookings;
}


/* =========================
   DISPLAY BOOKINGS
   ========================= */

function displayBookings() {
    const container = getElement(
        "bookingRecords",
        "bookings",
        "bookingList",
        "booking-list"
    );

    if (!container) {
        return;
    }

    const bookings = getBookingsArray();

    container.innerHTML = "";

    if (bookings.length === 0) {
        container.innerHTML =
            `<div class="empty-state">No bookings available.</div>`;

        return;
    }

    bookings.forEach(booking => {
        const item = document.createElement("div");

        item.className = "booking-card";

        item.innerHTML = `
            <div class="booking-header">
                <strong>Booking #${booking.bookingID}</strong>
                <span>$${booking.fare.toFixed(2)}</span>
            </div>

            <div class="booking-info">
                <p><strong>Passenger:</strong> ${escapeHTML(booking.passengerName)}</p>
                <p><strong>Phone:</strong> ${escapeHTML(booking.phone)}</p>
                <p><strong>Seat:</strong> ${booking.seatNumber}</p>
            </div>

            <button
                class="cancel-booking"
                data-booking-id="${booking.bookingID}">
                Cancel Booking
            </button>
        `;

        container.appendChild(item);
    });

    container
        .querySelectorAll(".cancel-booking")
        .forEach(button => {
            button.addEventListener("click", () => {
                const id = parseInt(
                    button.dataset.bookingId,
                    10
                );

                cancelBooking(id);
            });
        });
}


/* =========================
   CANCEL BOOKING
   ========================= */

function cancelBooking(bookingID) {
    let current = bookingHead;
    let previous = null;

    while (
        current !== null &&
        current.bookingID !== bookingID
    ) {
        previous = current;
        current = current.next;
    }

    if (current === null) {
        showMessage("Booking not found.", "error");
        return;
    }

    const seat = getSeat(current.seatNumber);

    if (seat) {
        seat.booked = false;
        seat.selected = false;
    }

    if (previous === null) {
        bookingHead = current.next;
    } else {
        previous.next = current.next;
    }

    processWaitingList();

    displayAircraft();
    displayBookings();
    displayWaitingList();
    updateStatistics();

    showMessage(
        `Booking #${bookingID} cancelled successfully.`,
        "success"
    );
}


/* =========================
   SEARCH SEAT
   ========================= */

function searchSeat() {
    const input = getElement(
        "searchSeat",
        "search-seat",
        "seatSearch"
    );

    const seatNumber = input
        ? input.value.trim().toUpperCase()
        : prompt("Enter seat number:");

    if (!seatNumber) {
        return;
    }

    const seat = getSeat(seatNumber);

    if (!seat) {
        showMessage("Seat not found.", "error");
        return;
    }

    showSeatDetails(seat);
}


/* =========================
   SEAT DETAILS
   ========================= */

function showSeatDetails(seat) {
    const status = seat.booked
        ? "BOOKED"
        : seat.selected
            ? "SELECTED"
            : "AVAILABLE";

    const special = [];

    if (seat.bulkhead) {
        special.push("Bulkhead");
    }

    if (seat.exitRow) {
        special.push("Exit Row");
    }

    const message = `
        Seat: ${seat.seatNumber}
        Type: ${seat.type}
        Price: $${seat.price.toFixed(2)}
        Status: ${status}
        ${special.length ? "Special: " + special.join(", ") : ""}
    `;

    alert(message);
}


/* =========================
   FILTER SEATS
   ========================= */

function filterSeats(type) {
    const results = [];

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const seat = aircraft[row][col];

            if (seat.booked) {
                continue;
            }

            let match = false;

            switch (type) {
                case "window":
                    match = seat.type === "Window";
                    break;

                case "middle":
                    match = seat.type === "Middle";
                    break;

                case "aisle":
                    match = seat.type === "Aisle";
                    break;

                case "bulkhead":
                    match = seat.bulkhead;
                    break;

                case "exit":
                    match = seat.exitRow;
                    break;

                case "available":
                    match = true;
                    break;

                default:
                    match = false;
            }

            if (match) {
                results.push(seat);
            }
        }
    }

    displayFilterResults(results);
}


/* =========================
   FILTER RESULTS
   ========================= */

function displayFilterResults(results) {
    const container = getElement(
        "filterResults",
        "filter-results"
    );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (results.length === 0) {
        container.innerHTML =
            `<div class="empty-state">No matching seats available.</div>`;
        return;
    }

    results.forEach(seat => {
        const item = document.createElement("button");

        item.type = "button";
        item.className = "filter-seat";

        item.innerHTML = `
            <strong>${seat.seatNumber}</strong>
            <span>${seat.type}</span>
            <span>$${seat.price.toFixed(2)}</span>
        `;

        item.addEventListener("click", () => {
            if (!seat.booked) {
                toggleSeat(seat.seatNumber);
            }
        });

        container.appendChild(item);
    });
}


/* =========================
   WAITING LIST - QUEUE
   ========================= */

function addToWaitingList() {
    const nameInput = getElement(
        "waitingName",
        "waiting-name"
    );

    const phoneInput = getElement(
        "waitingPhone",
        "waiting-phone"
    );

    const name = nameInput
        ? nameInput.value.trim()
        : prompt("Enter passenger name:");

    const phone = phoneInput
        ? phoneInput.value.trim()
        : prompt("Enter phone number:");

    if (!name) {
        showMessage("Passenger name is required.", "error");
        return;
    }

    if (!phone) {
        showMessage("Phone number is required.", "error");
        return;
    }

    waitingQueue.push({
        passengerName: name,
        phone: phone
    });

    if (nameInput) {
        nameInput.value = "";
    }

    if (phoneInput) {
        phoneInput.value = "";
    }

    displayWaitingList();
    updateStatistics();

    showMessage(
        `${name} has been added to the waiting list.`,
        "success"
    );
}


/* =========================
   DISPLAY WAITING LIST
   ========================= */

function displayWaitingList() {
    const container = getElement(
        "waitingList",
        "waiting-list"
    );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (waitingQueue.length === 0) {
        container.innerHTML =
            `<div class="empty-state">Waiting list is empty.</div>`;
        return;
    }

    waitingQueue.forEach((passenger, index) => {
        const item = document.createElement("div");

        item.className = "waiting-card";

        item.innerHTML = `
            <span class="queue-number">${index + 1}</span>

            <div>
                <strong>${escapeHTML(passenger.passengerName)}</strong>
                <small>${escapeHTML(passenger.phone)}</small>
            </div>
        `;

        container.appendChild(item);
    });
}


/* =========================
   PROCESS WAITING LIST
   ========================= */

function processWaitingList() {
    if (waitingQueue.length === 0) {
        return;
    }

    let freeSeat = null;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (!aircraft[row][col].booked) {
                freeSeat = aircraft[row][col];
                break;
            }
        }

        if (freeSeat !== null) {
            break;
        }
    }

    if (!freeSeat) {
        return;
    }

    const passenger = waitingQueue.shift();

    freeSeat.booked = true;
    freeSeat.selected = false;

    addBooking(
        passenger.passengerName,
        passenger.phone,
        freeSeat.seatNumber,
        freeSeat.price
    );

    showMessage(
        `${passenger.passengerName} was automatically assigned ${freeSeat.seatNumber}.`,
        "success"
    );
}


/* =========================
   STATISTICS
   ========================= */

function calculateStatistics() {
    let totalSeats = ROWS * COLS;
    let bookedSeats = 0;
    let availableSeats = 0;

    let windowSeats = 0;
    let middleSeats = 0;
    let aisleSeats = 0;

    let bulkheadSeats = 0;
    let exitSeats = 0;

    let revenue = 0;

    aircraft.forEach(row => {
        row.forEach(seat => {
            if (seat.booked) {
                bookedSeats++;
                revenue += seat.price;
            } else {
                availableSeats++;
            }

            if (seat.type === "Window") {
                windowSeats++;
            } else if (seat.type === "Middle") {
                middleSeats++;
            } else {
                aisleSeats++;
            }

            if (seat.bulkhead) {
                bulkheadSeats++;
            }

            if (seat.exitRow) {
                exitSeats++;
            }
        });
    });

    return {
        totalSeats,
        bookedSeats,
        availableSeats,
        windowSeats,
        middleSeats,
        aisleSeats,
        bulkheadSeats,
        exitSeats,
        revenue,
        waitingPassengers: waitingQueue.length
    };
}


/* =========================
   UPDATE STATISTICS
   ========================= */

function updateStatistics() {
    const stats = calculateStatistics();

    setText("totalSeats", stats.totalSeats);
    setText("bookedSeats", stats.bookedSeats);
    setText("availableSeats", stats.availableSeats);

    setText("windowSeats", stats.windowSeats);
    setText("middleSeats", stats.middleSeats);
    setText("aisleSeats", stats.aisleSeats);

    setText("bulkheadSeats", stats.bulkheadSeats);
    setText("exitSeats", stats.exitSeats);

    setText(
        "totalRevenue",
        `$${stats.revenue.toFixed(2)}`
    );

    setText(
        "waitingPassengers",
        stats.waitingPassengers
    );

    const occupancy =
        stats.totalSeats > 0
            ? (stats.bookedSeats / stats.totalSeats) * 100
            : 0;

    setText(
        "occupancyRate",
        `${occupancy.toFixed(1)}%`
    );
}


/* =========================
   SELECTED COUNT / FARE
   ========================= */

function updateSelectedCount() {
    setText(
        "selectedCount",
        selectionStack.length
    );
}

function updateTotalFare() {
    let total = 0;

    selectionStack.forEach(seatNumber => {
        const seat = getSeat(seatNumber);

        if (seat) {
            total += seat.price;
        }
    });

    setText(
        "selectedFare",
        `$${total.toFixed(2)}`
    );
}


/* =========================
   UTILITY - SET TEXT
   ========================= */

function setText(id, value) {
    const element = $(id);

    if (element) {
        element.textContent = value;
    }
}


/* =========================
   MESSAGE SYSTEM
   ========================= */

function showMessage(message, type = "info") {
    let container = $("toast-container");

    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";

        document.body.appendChild(container);
    }

    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;

    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}


/* =========================
   HTML SECURITY
   ========================= */

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================
   GLOBAL BUTTON EVENTS
   ========================= */

function setupEvents() {

    const bookButton = getElement(
        "bookSeats",
        "book-seats",
        "confirmBooking",
        "confirm-booking"
    );

    if (bookButton) {
        bookButton.addEventListener(
            "click",
            bookSelectedSeats
        );
    }

    const undoButton = getElement(
        "undoSelection",
        "undo-selection"
    );

    if (undoButton) {
        undoButton.addEventListener(
            "click",
            undoSelection
        );
    }

    const clearButton = getElement(
        "clearSelections",
        "clear-selections"
    );

    if (clearButton) {
        clearButton.addEventListener(
            "click",
            clearSelections
        );
    }

    const searchButton = getElement(
        "searchButton",
        "search-button"
    );

    if (searchButton) {
        searchButton.addEventListener(
            "click",
            searchSeat
        );
    }

    const waitingButton = getElement(
        "addWaiting",
        "add-waiting"
    );

    if (waitingButton) {
        waitingButton.addEventListener(
            "click",
            addToWaitingList
        );
    }


    /* Filter buttons */

    document.querySelectorAll("[data-filter]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const filterType =
                    button.dataset.filter;

                filterSeats(filterType);

            });

        });


    /* Search with ENTER */

    const searchInput = getElement(
        "searchSeat",
        "search-seat",
        "seatSearch"
    );

    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {
                    searchSeat();
                }

            }
        );

    }
}


/* =========================
   KEYBOARD SHORTCUTS
   ========================= */

document.addEventListener("keydown", event => {

    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "z"
    ) {
        event.preventDefault();

        undoSelection();
    }

});


/* =========================
   APPLICATION START
   ========================= */

function startApplication() {

    initializeAircraft();

    setupEvents();

    displayAircraft();

    displayBookings();

    displayWaitingList();

    updateStatistics();

    updateSelectedCount();

    updateTotalFare();

    console.log(
        "Aircraft Booking System initialized successfully."
    );
}


/* =========================
   START
   ========================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        startApplication
    );

} else {

    startApplication();

}