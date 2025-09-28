$(window).on("load", function () {
    currentLocation();
    checkLocalStorage();
    startUpdatingTime();
});

// API Key for all weather data
var APIKey = "839e7f0fac9bf535bae0a12f96ba765e";
var q = "";
var now = moment();
var isCelsius = true;

//Date and time format for header
function startUpdatingTime(i) {
    // Use moment to get the current time and format it
    setInterval(function () {
        // Get the current date and time including seconds
        var currentDate = moment().format("MMMM Do YYYY || h:mm:ss a");

        // Update the text content of the HTML element with the current time
        $("#currentDay").text(currentDate);
    }, 1000); // Update every second
}

//Setting the click function at ID search button
// Flag variable to track if checkLocalStorage() has run
let hasCheckedLocalStorage = false;

$("#search-button").on("click", function (event) {
    // Preventing the button from trying to submit the form
    event.preventDefault();

    let q = $("#city-input").val();
    if (q === "") {
        return alert("Please Enter Valid City Name!");
    }
    getWeather(q);
    saveToLocalStorage(q);

    $("#city-input").val(""); // Add this line to clear the input field

    // Check if checkLocalStorage() has already been called
    if (!hasCheckedLocalStorage) {
        $("#historyList").empty();
        checkLocalStorage();
        // Set the flag to true so it won't be called again
        hasCheckedLocalStorage = true;
    }
});

// Autocomplete functionality using GeoAPI
$("#city-input").autocomplete({
    source: function (request, response) {
        $.ajax({
            url: "https://api.geoapify.com/v1/geocode/autocomplete",
            data: {
                text: request.term,
                apiKey: "YOUR_GEOAPI_KEY"
            },
            success: function (data) {
                response(data.features.map(function (item) {
                    return {
                        label: item.properties.city,
                        value: item.properties.city
                    };
                }));
            }
        });
    },
    minLength: 2
});

// Function to create Button for searched city
function createRecentSearchBtn(q) {
    var newLi = $("<li>");
    var newBtn = $("<button>");
    //Adding Extra ID for Button to stop Creating Duplicate Button on Click
    newBtn.attr("id", "extraBtn");
    newBtn.addClass("button is-small recentSearch");
    newBtn.text(q);
    newLi.append(newBtn);
    $("#historyList").prepend(newLi);
    //setting click function to prevent duplicate button
    $("#extraBtn").on("click", function () {
        var newQ = $(this).text();
        getWeather(newQ);
    });
}

//converting temperature F to Celsius
function convertToC(fahrenheit) {
    var fTempVal = fahrenheit;
    var cTempVal = (fTempVal - 32) * (5 / 9);
    var celcius = Math.round(cTempVal * 10) / 10;
    return celcius;
}

//Function to get weather details
function getWeather(q) {
    var queryURL =
        "https://api.openweathermap.org/data/2.5/weather?q=" +
        q +
        "&units=imperial&appid=" +
        APIKey;

    $.ajax({
        url: queryURL,
        method: "GET",
        error: (err) => {
            alert(
                "Your city was not found. Check your spelling or enter a city code"
            );
            return;
        },
    }).then(function (response) {
        console.log(response);

        // Extract the time zone offset from the API response
        var timezoneOffset = response.timezone;

        // Convert the current UTC time to the city's local time
        var cityTime = moment
            .utc()
            .utcOffset(timezoneOffset / 60)
            .format("MMMM Do YYYY || h:mm a");

        // Empty the city list to avoid duplication
        $(".cityList").empty();
        $("#days").empty();

        var temp = convertToC(response.main.temp);
        var tempUnit = "°C";
        var cityMain1 = $("<div>").append(
            $("<p><h2>" + response.name + " (" + cityTime + ")" + "</h2><p>")
        );
        var image = $('<img class="imgsize">').attr(
            "src",
            "http://openweathermap.org/img/w/" + response.weather[0].icon + ".png"
        );
        var degreeMain = $("<p>").text(
            "Temperature : " + temp + " " + tempUnit
        );
        var conditionMain = $("<p>").text(
            "Condition : " + response.weather[0].description
        );
        var humidityMain = $("<p>").text(
            "Humidity : " + response.main.humidity + "%"
        );
        var windMain = $("<p>").text("Wind Speed : " + response.wind.speed + "MPH");
        var uvIndexcoord =
            "&lat=" + response.coord.lat + "&lon=" + response.coord.lon;
        var cityId = response.id;

        displayUVindex(uvIndexcoord);
        displayForecast(cityId);

        cityMain1
            .append(image)
            .append(degreeMain)
            .append(conditionMain)
            .append(humidityMain)
            .append(windMain);
        $("#cityList").empty();
        $("#cityList").append(cityMain1);

        // Change background based on weather condition
        changeBackground(response.weather[0].main.toLowerCase());
    });
}

//function for UV Index
function displayUVindex(uv) {
    $.ajax({
        // gets the UV index info
        url: "https://api.openweathermap.org/data/2.5/uvi?appid=" + APIKey + uv,
        method: "GET",
    }).then(function (response) {
        var UVIndex = $("<p><span>");
        UVIndex.attr("class", "badge badge-danger");
        UVIndex.text(response.value);
        $("#cityList").append("UV-Index : ").append(UVIndex);
    });
}

//function to Display 5 Day forecast
function displayForecast(c) {
    $.ajax({
        // gets the 5 day forecast API
        url:
            "https://api.openweathermap.org/data/2.5/forecast?id=" +
            c +
            "&units=imperial&APPID=" +
            APIKey,
        method: "GET",
    }).then(function (response) {
        //  Parse response to display forecast for next 5 days underneath current conditions
        var arrayList = response.list;
        for (var i = 0; i < arrayList.length; i++) {
            if (arrayList[i].dt_txt.split(" ")[1] === "12:00:00") {
                console.log(arrayList[i]);
                var temp = convertToC(arrayList[i].main.temp);
                var tempUnit = "°C";
                var cityMain = $("<div>");
                cityMain.addClass(
                    "col forecast bg-primary text-white ml-3 mb-3 rounded>"
                );
                var date5 = $("<h5>").text(response.list[i].dt_txt.split(" ")[0]);
                var image = $("<img>").attr(
                    "src",
                    "http://openweathermap.org/img/w/" +
                    arrayList[i].weather[0].icon +
                    ".png"
                );
                var degreeMain = $("<p>").text(
                    "Temp : " + temp + " " + tempUnit
                );
                var humidityMain = $("<p>").text(
                    "Humidity : " + arrayList[i].main.humidity + "%"
                );
                var windMain = $("<p>").text(
                    "Wind Speed : " + arrayList[i].wind.speed + "MPH"
                );
                cityMain
                    .append(date5)
                    .append(image)
                    .append(degreeMain)
                    .append(humidityMain)
                    .append(windMain);
                $("#days").append(cityMain);
            }
        }
    });
}

// Display automatic Current Location
function currentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            var queryURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKey}`;
            $.ajax({
                url: queryURL,
                method: "GET",
                success: function (response) {
                    getWeather(response.name);
                }
            });
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Function to get data from Local Storage
function checkLocalStorage() {
    var storedData = localStorage.getItem("queries");
    var dataArray = [];
    if (!storedData) {
        console.log("no data stored");
    } else {
        dataArray = JSON.parse(storedData);
        dataArray.forEach(function (city) {
            createRecentSearchBtn(city);
        });
    }
}

// Function to Set data in Local storage
function saveToLocalStorage(q) {
    var storedData = localStorage.getItem("queries");
    var dataArray = [];
    if (storedData) {
        dataArray = JSON.parse(storedData);
    }
    if (!dataArray.includes(q)) {
        dataArray.push(q);
        localStorage.setItem("queries", JSON.stringify(dataArray));
        createRecentSearchBtn(q);
    }
}

// Function to change background based on weather condition
function changeBackground(condition) {
    $("body").removeClass("sunny cloudy rainy snowy");
    if (condition.includes("clear")) {
        $("body").addClass("sunny");
    } else if (condition.includes("clouds")) {
        $("body").addClass("cloudy");
    } else if (condition.includes("rain")) {
        $("body").addClass("rainy");
    } else if (condition.includes("snow")) {
        $("body").addClass("snowy");
    }
}



function removeStorage() {
    localStorage.removeItem("queries");
}

$("#clear-history").on("click", function (event) {
    $("#historyList").empty();
    removeStorage();
});

