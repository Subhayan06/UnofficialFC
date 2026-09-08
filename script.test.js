const test = require('node:test');
const assert = require('node:assert/strict');
const { updateTimer, launchDate } = require('./script.js');

// Helper to set up mock DOM elements
function setupMockDOM() {
    const elements = {
        days: { innerText: '' },
        hours: { innerText: '' },
        mins: { innerText: '' },
        secs: { innerText: '' }
    };

    global.document = {
        getElementById: (id) => elements[id] || null
    };

    return elements;
}

// Helper to mock current time for Date constructor
function mockCurrentTime(nowMs) {
    const RealDate = Date;
    global.Date = class extends RealDate {
        constructor(...args) {
            if (args.length === 0) {
                super(nowMs);
            } else {
                super(...args);
            }
        }
    };
    return () => {
        global.Date = RealDate;
    };
}

test('updateTimer - correctly calculates days, hours, minutes, seconds and formats with leading zeros', () => {
    const elements = setupMockDOM();

    // 1 day, 2 hours, 3 minutes, 4 seconds before launchDate
    const offsetMs = ((1 * 24 + 2) * 60 + 3) * 60 * 1000 + 4000;
    const mockNow = launchDate - offsetMs;
    const restoreDate = mockCurrentTime(mockNow);

    try {
        updateTimer();

        assert.equal(elements.days.innerText, '01');
        assert.equal(elements.hours.innerText, '02');
        assert.equal(elements.mins.innerText, '03');
        assert.equal(elements.secs.innerText, '04');
    } finally {
        restoreDate();
    }
});

test('updateTimer - correctly handles multi-digit days and non-padded numbers', () => {
    const elements = setupMockDOM();

    // 86 days, 15 hours, 45 minutes, 30 seconds before launchDate
    const offsetMs = (((86 * 24 + 15) * 60 + 45) * 60 + 30) * 1000;
    const mockNow = launchDate - offsetMs;
    const restoreDate = mockCurrentTime(mockNow);

    try {
        updateTimer();

        assert.equal(elements.days.innerText, '86');
        assert.equal(elements.hours.innerText, '15');
        assert.equal(elements.mins.innerText, '45');
        assert.equal(elements.secs.innerText, '30');
    } finally {
        restoreDate();
    }
});

test('updateTimer - handles exactly 1 second remaining', () => {
    const elements = setupMockDOM();

    const offsetMs = 1000;
    const mockNow = launchDate - offsetMs;
    const restoreDate = mockCurrentTime(mockNow);

    try {
        updateTimer();

        assert.equal(elements.days.innerText, '00');
        assert.equal(elements.hours.innerText, '00');
        assert.equal(elements.mins.innerText, '00');
        assert.equal(elements.secs.innerText, '01');
    } finally {
        restoreDate();
    }
});

test('updateTimer - returns "00" for all units when launchDate is reached (distance === 0)', () => {
    const elements = setupMockDOM();

    const restoreDate = mockCurrentTime(launchDate);

    try {
        updateTimer();

        assert.equal(elements.days.innerText, '00');
        assert.equal(elements.hours.innerText, '00');
        assert.equal(elements.mins.innerText, '00');
        assert.equal(elements.secs.innerText, '00');
    } finally {
        restoreDate();
    }
});

test('updateTimer - returns "00" for all units when launchDate has passed (distance < 0)', () => {
    const elements = setupMockDOM();

    // 5000ms after launchDate
    const restoreDate = mockCurrentTime(launchDate + 5000);

    try {
        updateTimer();

        assert.equal(elements.days.innerText, '00');
        assert.equal(elements.hours.innerText, '00');
        assert.equal(elements.mins.innerText, '00');
        assert.equal(elements.secs.innerText, '00');
    } finally {
        restoreDate();
    }
});
