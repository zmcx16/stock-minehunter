'use strict';

const bg_color = [  { 'bg1': 'aliceblue', 'bg2': 'rgb(255,251,248)' },
                    { 'bg1': 'cornsilk', 'bg2': 'cornsilk' },
                    { 'bg1': 'honeydew', 'bg2': 'honeydew' },
                    { 'bg1': 'mintcream', 'bg2': 'mintcream' },
                    { 'bg1': 'snow', 'bg2': 'snow' }];

const max_target_cnt = 50;
                    
// tactics data
var tactics_data = null;

function selectBasicColor(){
    var select = Math.floor(Math.random() * bg_color.length);
    $('body').css('background-color', bg_color[select].bg1);
    $('.wrapper-0').css('background', bg_color[select].bg2);
}

function loadTacticsArgs() {
    var list_index = $("#tactics-select")[0].selectedIndex;

    $("#tactics-content-description")[0].innerHTML = tactics_data[list_index].description;
    $("#tactics-args")[0].innerHTML =
        '<div class="tactics-arg-text"><span class="span text-right">Tactic Name:</span></div>' +
        '<div></div>' +
        '<input type="text" id="tactics-arg-val-name" name="tactics-arg-val-name" value="MyTactic">' +
        '<div></div>';
    tactics_data[list_index].args.forEach(function (element, index, array) {
        $("#tactics-args")[0].innerHTML +=
            '<div class="tactics-arg-text"><span class="span text-right">' + element.name_display + '</span></div>' +
            '<div></div>' +
            '<input type="text" id="tactics-arg-val-' + index + '" name="tactics-arg-val-' + index + '" value="' + element.default + '">' +
            '<div></div>';
    });
}

function loadTactics(data){
    tactics_data = data;

    $("#tactics-select")[0].innerHTML = "";
    tactics_data.forEach((element) => {
        $("#tactics-select")[0].innerHTML += '<option value="' + element.type + '">' + element.type_display + '</option>';
    });

    loadTacticsArgs();
}


function buildTacticParameter(list_index, tactic_input) {

    var display_data = "";
    var para_data = {};

    for (var i = 0; i < tactic_input.length; i++) {
        var name = tactic_input[i].id.replace("tactics-arg-val-", "");
        if (name !== "name") {
            var key = tactics_data[list_index].args[parseInt(name)].name;
            var val = tactic_input[i].value;
            para_data[key] = val;
            display_data += key + ": " + val + "; ";
        }
    }

    return '<td class="parameter-td" value="' + btoa(JSON.stringify(para_data)) + '">' + display_data + '</td>';
}

function addTactic() {

    if (!$("#add-symbol-input")[0].value){
        $('#alert-dialog-content')[0].innerText = "The target symbols are invalid, add tactic failed.";
        $('#alert-dialog-hidden-btn').click();
        return;
    }

    var targets = $("#add-symbol-input")[0].value.split(' ').join('').split(',').join(',');

    var tactic_input = $("#tactics-args").children('input');
    for (var i = 0; i < tactic_input.length; i++) {
        if (!tactic_input[i].value){
            $('#alert-dialog-content')[0].innerText = "The tactic parameter are invalid, add tactic failed.";
            $('#alert-dialog-hidden-btn').click();
            return;
        }
    }

    var list_index = $("#tactics-select")[0].selectedIndex;

    $("#tactics-tbody")[0].innerHTML +=
        '<tr class="tactics-tr">'+
            '<td class="name-td">' + $("#tactics-arg-val-name")[0].value + '</td>'+
            '<td class="type-td">' + tactics_data[list_index].type + '</td>'+
            '<td class="target-td">' + targets + '</td>' +
            buildTacticParameter(list_index, tactic_input)+
            '<td><span class="remove"><button type="button" class="close remove-tactic"><span>&times;</span></button></span></td>'+
        '</tr>';

    $("#tactics-add-list").css("display","block");

    $('.close.remove-tactic').unbind("click");
    $('.close.remove-tactic').click(function () {
        $(this).parent().parent().parent().remove();
        if (!$(".tactics-tr")[0]){
            $("#tactics-add-list").css("display", "none");
        }
    });
}

function displayScanReports(resp_data) {

    if (resp_data["ret"] !== 0) {
        $('#alert-dialog-content')[0].innerText = resp_data["err_msg"];
        $('#alert-dialog-hidden-btn').click();
        return;
    }

    $("#scan-output-container")[0].innerHTML = "";
    resp_data.data.forEach((element) => {
        //console.log(element);
        var score_dict = { "pass": 0, "fail": 0, "nodata": 0 };
        var report_detail = "";
        var base_info = "";

        Object.entries(element["baseinfo"]).forEach(([key, value]) => {
            base_info += '<div class="base-data"><span class="span-12px">' + key + ':</span><span class="span-12px base-data-value">' + value + '</span></div><div></div>';
        });

        element["report"].forEach((arg) => {
            if (arg["pass"] === -1) {
                report_detail += '<span style="color: red;">[Fail] </span>';
                score_dict["fail"] += 1;
            } else if (arg["pass"] === 1) {
                report_detail += '<span style="color: limegreen;">[Pass] </span>';
                score_dict["pass"] += 1;
            } else {
                report_detail += '<span>[No Data] </span>';
                score_dict["nodata"] += 1;
            }
            report_detail += arg["msg"] + "\n";
        });

        var name = element["name"] + ": " + element["symbol"];
        var score = Math.round(score_dict["fail"] / (score_dict["pass"] + score_dict["fail"]) * 100);

        $("#scan-output-container")[0].innerHTML +=
            '<div class="scan-output">' +
            '<div class="output-stage1">' +
            '<div class="output-norn-image"><img src="./image/norn.png"></div>' +
            '<div class="output-info1">' +
            '<span class="span-xx-large output-name">' + name + '</span>' +
            '<div class="output-info1-baseinfo">' + base_info + '</div>' +
            '</div>' +
            '<div class="output-info2">' +
            '<div><img class="bomb-icon" src="./image/bomb.png"></div>' +
            '<div class="span-x-large bomb-rate">' + score.toString() + '%</div>' +
            '</div>' +
            '</div>' +
            '<div class="output-stage2">' + report_detail + '</div>' +
            '</div>';
    });

    $('#display-page')[0].scrollIntoView({ behavior: "smooth" });
}

function sendScan(){

    if (!$(".tactics-tr")[0]) {
        $('#alert-dialog-content')[0].innerText = "No tactic data, please add tactic data and try again.";
        $('#alert-dialog-hidden-btn').click();
        return;
    }

    var data = [];
    var total_target_cnt = 0;
    try {
        $(".tactics-tr").each(function () {
            var tactic_data = {};
            tactic_data["name"] = $(this).find(".name-td")[0].innerHTML;
            tactic_data["type"] = $(this).find(".type-td")[0].innerHTML;
            tactic_data["target"] = $(this).find(".target-td")[0].innerHTML.split(',');
            total_target_cnt += tactic_data["target"].length;
            tactic_data["args"] = JSON.parse(atob($(this).find(".parameter-td").attr("value")));

            data.push(tactic_data);
            //console.log($(this));
            //console.log(tactic_data);
        });
    } catch (ex) {
        console.log(ex);
        $('#alert-dialog-content')[0].innerText = "Parse tactic data failed, the tactic data are invalid.";
        $('#alert-dialog-hidden-btn').click();
        return;
    }

    if (total_target_cnt > max_target_cnt){
        $('#alert-dialog-content')[0].innerText = "The targets size: " + total_target_cnt + " > " + max_target_cnt + ", remove some tactics or targets and try again.";
        $('#alert-dialog-hidden-btn').click();
        return;   
    }

    // get scan result
    LoadingImg.doLoading(true);
    $.ajax({
        type: 'POST',
        url: 'https://zmcx16.moe/stock-minehunter/api/task/do-scan',   
        async: true,
        data: "=" + JSON.stringify({ "data": data }),
        success: function (resp_data, textStatus, xhr) {
            LoadingImg.doLoading(false);
            if (resp_data) {
                console.log(resp_data);
                displayScanReports(resp_data);
            }
            else {
                console.log('get scan reports failed: ' + xhr);
                $('#alert-dialog-content')[0].innerText = "Get scan reports failed.";
                $('#alert-dialog-hidden-btn').click();
            }
        },
        error: function (xhr, textStatus, errorThrown) {
            LoadingImg.doLoading(false);
            console.log('Get scan reports failed: ' + xhr);
            console.log('Get scan reports failed: ' + textStatus);
            console.log('Get scan reports failed: ' + errorThrown);
            $('#alert-dialog-content')[0].innerText = "Get scan reports failed.";
            $('#alert-dialog-hidden-btn').click();
        },
        timeout: 300000
    });
}

function resizeWindowHeight(){
    var stretchHeight = window.innerHeight - ($(".wrapper").height() - $("#scan-output-container").height());
    $("#scan-output-container").css("min-height", stretchHeight);
}

// start
$(document).ready(function () {

    // init
    selectBasicColor();
    LoadingImg.doLoading(true);

    // get tactics
    $.ajax({
        url: 'https://zmcx16.moe/stock-minehunter/api/task/get-tactics',
        async: true,
        success: function (resp_data, textStatus, xhr) {
            LoadingImg.doLoading(false);
            if (resp_data) {
                console.log(resp_data);
                loadTactics(resp_data.data);
            }
            else {
                console.log('get tactics failed: ' + xhr);
                $('#alert-dialog-content')[0].innerText = "Get Tactics failed.";
                $('#alert-dialog-hidden-btn').click();
            }
            resizeWindowHeight();

        },
        error: function (xhr, textStatus, errorThrown) {
            LoadingImg.doLoading(false);
            console.log('get tactics failed: ' + xhr);
            console.log('get tactics failed: ' + textStatus);
            console.log('get tactics failed: ' + errorThrown);
            $('#alert-dialog-content')[0].innerText = "Get Tactics failed, please try reload the page again.";
            $('#alert-dialog-hidden-btn').click();

            resizeWindowHeight();
        },
        timeout: 60000
    });


    // event register
    $("#tactics-select").on('change', function(){
        if(tactics_data){
            loadTacticsArgs();
        }
    });

    $("#reset-button").click(function () {
        if (tactics_data) {
            loadTacticsArgs();
        }
    });

    $("#add-button").click(function () {
        if (tactics_data) {
            addTactic();
        }
    });

    $("#scan-button").click(function () {
        if (tactics_data) {
            sendScan();
        }
    });
});
