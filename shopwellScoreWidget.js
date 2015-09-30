//developerMode shows more form elements like account name/password
var developerMode = true;
var endpoint = "https://api.shopwell.com/"; //"http://wwwpre.shopwell.com/api/";
var nutritionString = "";
var tradeUpOneUPC, tradeUpTwoUPC, tradeUpThreeUPC; //store URL for trade up instant lookup

//jquery called after page loads to init
$(document).ready(function() {
  //example UPCs, more can be added for autocomplete
    var availableTags = [
        "3338351050",
        "7594081001",
        "4165306170",
        "1622900171"
    ];
    $("#upcInput").autocomplete({
        source: availableTags
    });
    $("button, input:submit, input:button").button();
    if (!developerMode) {
        $(".developer").css({
            "display": "none"
        });
    }

    $("#upcInput").val("7594081001");
    $("#nutritionContainer").css({
        "display": "none"
    });

    $("#upcButton").click(function() {
        startProductLookup();
    });
});

//init new product lookup by hiding UI elements
function startProductLookup() {
    $("#productContainer").css({
        "display": "none"
    });
    $("#tradeUpsContainer").css({
        "display": "none"
    });
    $("#nutritionContainer").css({
        "display": "none"
    });
    $("#ingredientsContainer").css({
        "display": "none"
    });
    $("#upcError").css({
        "display": "none"
    });
    $("#passwordError").css({
        "display": "none"
    });
    $("#userNameError").css({
        "display": "none"
    });

    //if user/pass are missing, display form error
    var userName = $("#accountName").val();
    var password = $("#password").val();
    if (userName != null && userName.length > 0) {
        if (password != null && password.length > 0) {
            var upcText = $("#upcInput").val();
            if (upcText == null || (upcText.length < 8 || upcText.length > 14)) {
                $("#upcError").css({
                    "display": "block"
                });
            } else {
                //all fields present - go to api request
                apiGetProductDetails(upcText, userName, password);
            }
        } else {
            $("#passwordError").css({
                "display": "block"
            });
            //bad password
        }
    } else {
        // bad username
        $("#userNameError").css({
            "display": "block"
        });
    }
}

//Get product details through GET API request
function apiGetProductDetails(upcText, userName, password) {
    var apiUrl = endpoint + "getProduct.json?upc=" + upcText + "&apiAccountId=" + userName +
        "&apiAccountPassword=" + password;
    $.ajax({
        type: "GET",
        dataType: "jsonp",
        url: apiUrl,
        async: true,
        success: function(data) {
            $("#productError").css({
                "display": "none"
            });
            console.log(data);
            //get ingredients, parse
            getIngredientDetails(upcText, userName, password);
            //get nutrition, parse
            getNutritionDetails(upcText, userName, password);
            //parse product data once other APIs are sent out
            parseProductObject(data);

        },
        error: function(xhr, status, error) {
            //alert(xhr.responseText);
            $("#productError").css({
                "display": "block"
            });
        }
    });
}

//API to get ingredients to display
function getIngredientDetails(upcText, userName, password) {
    var apiUrl = endpoint + "getProductIngredients.json?upc=" + upcText + "&apiAccountId=" + userName +
        "&apiAccountPassword=" + password;
    $("#ingredientsContainer").css({
        "display": "none"
    });
    $("#ingredientsText").text("");
    $.ajax({
        type: "GET",
        dataType: "jsonp",
        url: apiUrl,
        success: function(data) {
            console.log(data.ingredients);
            $("#ingredientsContainer").css({
                "display": "block"
            });
            $("#ingredientsText").text(data.ingredients);
        },
        error: function(xhr, status, error) {
            //console.log(xhr.responseText);
        }
    });
}

//API get nutritional details to display (currently displaying as text, but possible to display in standard nutrition panel)
function getNutritionDetails(upcText, userName, password) {
    var apiUrl = endpoint + "getProductNutritionLabel.json?upc=" + upcText + "&apiAccountId=" + userName +
        "&apiAccountPassword=" + password;
    $("#nutritionContainer").css({
        "display": "none"
    });
    $("#nutritionText").text('');
    $.ajax({
        type: "GET",
        dataType: "jsonp",
        url: apiUrl,
        success: function(data) {
            console.log(data.standardNutritionLabel);
            $("#nutritionContainer").css({
                "display": "block"
            });
            var nutrition = "";
            $.each(data.standardNutritionLabel, function(key, value) {
                if (key != null) {
                    nutrition += key + ' ' + value + ' ';
                }

            });
            $("#nutritionText").text(nutrition);
            //  $("#ingredientsContainer").css({"display":"block"});
            //$("#ingredientsText").text(data.ingredients);
        },
        error: function(xhr, status, error) {
            //console.log(xhr.responseText);
        }
    });
}

//parse JSON, load into elements using jQuery
function parseProductObject(jsonObj) {
    //product details binding

    var productImageUrl = jsonObj.product_details.product_image_full;
    if (productImageUrl != null && productImageUrl.length > 0) {
        $("#productImage").attr("src", productImageUrl);
    }
    var productName = jsonObj.product_details.product_name;
    var brandName = jsonObj.product_details.brand_name;
    if (productName != null && productName.length > 0) {
        if (brandName != null && brandName.length > 0) {
            $("#productName").text(brandName + " " + productName);
        } else {
            $("#productName").text(productName);
        }
    }
    var fitScore = jsonObj.product_details.fit_score;
    if (fitScore != null) {
        $("#fitScoreText").text(fitScore);
    }
    var fitScoreType = jsonObj.product_details.fit_score_type;
    if (fitScoreType != null && fitScoreType.length > 0) {
        if (fitScoreType == "MEDIUM") {
            //ShopWell Yellow
            $("#fitScore").css("background-color", "#EEC908")
        } else if (fitScoreType == "LOW") {
            //ShopWell Red
            $("#fitScore").css("background-color", "#B70E03")
        } else if (fitScoreType == "HIGH") {
            //ShopWell Green
            $("#fitScore").css("background-color", "#5EA803")
        }
    }
    var productDescription = jsonObj.product_details.product_description;
    var productSize = jsonObj.product_details.product_size;
    var productSizeUnit = jsonObj.product_details.product_size_unit;
    productDescription = productDescription + " " + productSize + " " + productSizeUnit;
    if (productDescription != null && productDescription.length > 0) {
        $("#productDescription").text(productDescription);
    }
    $("#productContainer").css({
        "display": "block"
    });
    //trade ups binding
    var tradeUps = jsonObj.alternate_products;
    if (tradeUps != null && tradeUps.length > 0) {
        $("#tradeUpsContainer").css({
            "display": "block"
        });
        //three trade up containers, place each product in correct container
        for (var i = 0; i < 3; i++) {
            var tradeUpProductName = tradeUps[i].product_name;
            var tradeUpBrandName = tradeUps[i].brand_name;
            if (tradeUpProductName != null && tradeUpProductName.length > 0) {
                if (tradeUpBrandName != null && tradeUpBrandName.length > 0) {
                    tradeUpProductName = tradeUpBrandName + " " + tradeUpProductName;
                }
            }
            var tradeUpDescription = tradeUps[i].product_description;
            var productSize = tradeUps[i].product_size;
            var productSizeUnit = tradeUps[i].product_size_unit;
            tradeUpDescription = tradeUpDescription + " " + productSize + " " + productSizeUnit;
            var tradeUpFitScore = tradeUps[i].fit_score;
            var tradeUpFitScoreType = tradeUps[i].fit_score_type;
            var tradeUpImageUrl = tradeUps[i].product_image;
            var tradeUpUPC = tradeUps[i].upc;
            //switch to jQuery select correct trade up container

            switch (i) {
                case 0:
                    //unbind click event so multiple aren't fired
                    $("#tradeUpOne").unbind("click");

                    if (tradeUpUPC != null && tradeUpUPC.length > 0) {
                        tradeUpOneUPC = tradeUpUPC;
                        $("#tradeUpOne").click(function() {
                            console.log("clicked one");
                            $("#upcInput").val(tradeUpOneUPC);
                            startProductLookup();
                        });
                    }
                    if (tradeUpProductName != null && tradeUpProductName.length > 0) {
                        $("#tradeUpNameOne").text(tradeUpProductName);
                        if (tradeUpProductName.length > 40) {
                            $("#tradeUpNameOne").css("font-size", "12px");
                        } else {
                            $("#tradeUpNameOne").css("font-size", "16px");
                        }
                    }
                    if (tradeUpDescription != null && tradeUpDescription.length > 0) {
                        $("#tradeUpDescriptionOne").text(tradeUpDescription);
                    }
                    if (tradeUpFitScore != null && tradeUpFitScore.length > 0) {
                        $("#tradeUpFitScoreTextOne").text(tradeUpFitScore);
                    }
                    if (tradeUpFitScoreType != null && tradeUpFitScoreType.length > 0) {
                        if (tradeUpFitScoreType == "MEDIUM") {
                            //ShopWell Yellow
                            $("#tradeUpFitScoreOne").css("background-color", "#EEC908")
                        } else if (tradeUpFitScoreType == "LOW") {
                            //ShopWell Red
                            $("#tradeUpFitScoreOne").css("background-color", "#B70E03")
                        } else if (tradeUpFitScoreType == "HIGH") {
                            //ShopWell Green
                            $("#tradeUpFitScoreOne").css("background-color", "#5EA803")
                        }
                    }
                    if (tradeUpImageUrl != null && tradeUpImageUrl.length > 0) {
                        $("#tradeUpImageOne").attr("src", tradeUpImageUrl);
                    }
                    break;
                case 1:
                    $("#tradeUpTwo").unbind("click");
                    if (tradeUpUPC != null && tradeUpUPC.length > 0) {
                        tradeUpTwoUPC = tradeUpUPC;
                        $("#tradeUpTwo").click(function() {
                            console.log("clicked two");
                            $("#upcInput").val(tradeUpTwoUPC);
                            startProductLookup();
                        });
                    }
                    if (tradeUpProductName != null && tradeUpProductName.length > 0) {
                        $("#tradeUpNameTwo").text(tradeUpProductName);
                        if (tradeUpProductName.length > 40) {
                            $("#tradeUpNameTwo").css("font-size", "12px");
                        } else {
                            $("#tradeUpNameTwo").css("font-size", "16px");
                        }
                    }
                    if (tradeUpDescription != null && tradeUpDescription.length > 0) {
                        $("#tradeUpDescriptionTwo").text(tradeUpDescription);
                    }
                    if (tradeUpFitScore != null && tradeUpFitScore.length > 0) {
                        $("#tradeUpFitScoreTextTwo").text(tradeUpFitScore);
                    }
                    if (tradeUpFitScoreType != null && tradeUpFitScoreType.length > 0) {
                        if (tradeUpFitScoreType == "MEDIUM") {
                            //ShopWell Yellow
                            $("#tradeUpFitScoreTwo").css("background-color", "#EEC908")
                        } else if (tradeUpFitScoreType == "LOW") {
                            //ShopWell Red
                            $("#tradeUpFitScoreTwo").css("background-color", "#B70E03")
                        } else if (tradeUpFitScoreType == "HIGH") {
                            //ShopWell Green
                            $("#tradeUpFitScoreTwo").css("background-color", "#5EA803")
                        }
                    }
                    if (tradeUpImageUrl != null && tradeUpImageUrl.length > 0) {
                        $("#tradeUpImageTwo").attr("src", tradeUpImageUrl);
                    }
                    break;
                case 2:
                    $("#tradeUpThree").unbind("click");
                    if (tradeUpUPC != null && tradeUpUPC.length > 0) {
                        tradeUpThreeUPC = tradeUpUPC;
                        $("#tradeUpThree").click(function() {
                            console.log("clicked three");
                            $("#upcInput").val(tradeUpThreeUPC);
                            startProductLookup();
                        });
                    }
                    if (tradeUpProductName != null && tradeUpProductName.length > 0) {
                        $("#tradeUpNameThree").text(tradeUpProductName);
                        if (tradeUpProductName.length > 40) {
                            console.log(tradeUpProductName);
                            $("#tradeUpNameThree").css("font-size", "12px");
                        } else {
                            $("#tradeUpNameThree").css("font-size", "16px");
                        }
                    }
                    if (tradeUpDescription != null && tradeUpDescription.length > 0) {
                        $("#tradeUpDescriptionThree").text(tradeUpDescription);
                    }
                    if (tradeUpFitScore != null && tradeUpFitScore.length > 0) {
                        $("#tradeUpFitScoreTextThree").text(tradeUpFitScore);
                    }
                    if (tradeUpFitScoreType != null && tradeUpFitScoreType.length > 0) {
                        if (tradeUpFitScoreType == "MEDIUM") {
                            //ShopWell Yellow
                            $("#tradeUpFitScoreThree").css("background-color", "#EEC908")
                        } else if (tradeUpFitScoreType == "LOW") {
                            //ShopWell Red
                            $("#tradeUpFitScoreThree").css("background-color", "#B70E03")
                        } else if (tradeUpFitScoreType == "HIGH") {
                            //ShopWell Green
                            $("#tradeUpFitScoreThree").css("background-color", "#5EA803")
                        }
                    }
                    if (tradeUpImageUrl != null && tradeUpImageUrl.length > 0) {
                        $("#tradeUpImageThree").attr("src", tradeUpImageUrl);
                    }
                    break;
            }

        }
    } else {
        $("#tradeUpsContainer").css({
            "display": "none"
        });
    }



}
