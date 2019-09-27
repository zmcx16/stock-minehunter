'use strict';

const bg_color = [  { 'bg1': 'aliceblue', 'bg2': 'rgb(255,251,248)' },
                    { 'bg1': 'cornsilk', 'bg2': 'cornsilk' },
                    { 'bg1': 'honeydew', 'bg2': 'honeydew' },
                    { 'bg1': 'mintcream', 'bg2': 'mintcream' },
                    { 'bg1': 'snow', 'bg2': 'snow' }];

const drap_zone_bg = "#ffffff";
const drap_zone_hover_bg = "#cccccc";

const drap_zone_border = "2px dashed #bbb";
const drap_zone_hover_border = "2px solid #bbb";

const upload_file_icon_bg = "#ccc";
const upload_file_icon_val_bg = "#66DDAA";

const max_proto_size = 512000;

var proto_list = [];
var proto_js = null;
var proto_data = [];

var generating_js_interval = null;
var deserializing_interval = null;

// common function
const typeSizes = {
    "undefined": () => 0,
    "boolean": () => 4,
    "number": () => 8,
    "string": (item) => 2 * item.length
};

const sizeOf = (value) => typeSizes[typeof value](value);

function getProtosSize(){
    var total_size = 0;
    proto_list.forEach(function (element) {
        total_size += sizeOf(element.data);
    });
    return total_size;
}

// ui logic function
function setUploadFileIcon(id, length) {
    $('#' + id)[0].innerText = length;
    $('#' + id).css('background', length > 0 ? upload_file_icon_val_bg : upload_file_icon_bg);
}

function setGenerateProtoJSButton(generating) {
    if (generating) {
        $('#generate-protojs-button')[0].innerText = "Generating";
        $('#generate-protojs-button').prop('disabled', true);
        generating_js_interval = setInterval(() => {
            var dot_cnt = $('#generate-protojs-button')[0].innerText.split(".").length - 1;
            if (dot_cnt >= 3) {
                $('#generate-protojs-button')[0].innerText = "Generating";
            } else {
                $('#generate-protojs-button')[0].innerText += ".";
            }
        }, 1000);
    } else {
        $('#generate-protojs-button').prop('disabled', false);
        $('#generate-protojs-button')[0].innerText = "Generate";
        clearInterval(generating_js_interval);
    }
}

function showStep1Status(err) {
    if (err) {
        $('#step1-status')[0].innerText = err;
        $('#step1-status').css('color','red');
    }
    else if (proto_js) {
        $('#step1-status')[0].innerText = 'Generated ' + proto_js + ' was successful, continue to do step2.';
        $('#step1-status').css('color', 'initial');
    }
    else if (proto_list.length) {
        var file_list = [];
        proto_list.forEach(function (element) {
            file_list.push(element.name);
        });
        $('#step1-status')[0].innerText = 'proto files: ' + file_list.join(", ");
        $('#step1-status').css('color', 'initial');
    } else {
        $('#step1-status')[0].innerText = "No proto file";
        $('#step1-status').css('color', 'initial');
    }
}

function showStep2Status(err) {
    if (err) {
        $('#step2-status')[0].innerText = err;
        $('#step1-status').css('color', 'red');
    }
    else if (proto_data.length) {
        var file_list = [];
        proto_data.forEach(function(element){
            file_list.push(element.name);
        });
        $('#step2-status')[0].innerText = 'deserialize target files: ' + file_list.join(", ");
        $('#step1-status').css('color', 'initial');
    } else {
        $('#step2-status')[0].innerText = "No proto data file";
        $('#step1-status').css('color', 'initial');
    }
}

function selectBasicColor()
{
    var select = Math.floor(Math.random() * bg_color.length);
    $('body').css('background-color', bg_color[select].bg1);
    $('.wrapper-0').css('background', bg_color[select].bg2);
}


// main process
function handleAddProto(files) {
    proto_js = null;
    Object.entries(files).forEach(([key, value]) => {
        var reader = new FileReader();
        reader.onload = (function (theFile) {
            return function (e) {
                var base64_data = btoa(e.target.result);
                proto_list.push({ 'name': theFile.name, 'data': base64_data });
                setUploadFileIcon('proto-icon', proto_list.length);
                showStep1Status();
            };
        })(value);

        reader.readAsBinaryString(value);
    });
}

function handleAddPbData(files) {
    console.log(files);
    Object.entries(files).forEach(([key, value]) => {
        var reader = new FileReader();
        reader.onload = (function (theFile) {
            return function (e) {
                var base64_data = btoa(e.target.result);
                proto_data.push({ 'name': theFile.name, 'data': base64_data });
                setUploadFileIcon('pbdata-icon', proto_data.length);
                showStep2Status();
            };
        })(value);

        reader.readAsBinaryString(value);
    });
}

function generateProtoJS() {
    $.ajax({
        type: 'POST',
        url: 'https://zmcx16.moe/protobuf-deserializer/api/task/buildjs',
        async: true,
        data: "=" + JSON.stringify({ 'files': proto_list }),
        success: function (data, textStatus, xhr) {
            if (data) {
                console.log(data);
                if (data.ret === 0) {
                    proto_js = data.js_path;
                    $.getScript('https://zmcx16.moe/protobuf-deserializer/run/output/protojs/' + proto_js, function () {
                        console.log(ConstructorsDict);

                        // add proto class to select-proto
                        $("#proto-select")[0].innerHTML = "";
                        $("#proto-select").append('<option value="auto-detect">Auto Detect</option>');
                        Object.entries(ConstructorsDict).forEach(([key, value]) => {
                            let temp = '<option value="{name}">{name}</option>'.split("{name}").join(key);
                            $("#proto-select").append(temp);
                        });
                    });
                    showStep1Status();
                } else {
                    showStep1Status('Generated proto js library was failed, err code = ' + data.ret.toString());
                }
            }
            else {
                showStep1Status('Generated proto js library was failed, err = ' + textStatus);
                console.log('get failed: ' + textStatus);
                console.log('get failed: ' + xhr);
            }
            setGenerateProtoJSButton(false);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showStep1Status('Generated proto js library was failed, err = ' + textStatus);
            console.log('get failed: ' + jqXHR.status);
            console.log('get failed: ' + jqXHR.readyState);
            console.log('get failed: ' + textStatus);
            setGenerateProtoJSButton(false);
        },
        timeout: 180000
    });

}

function deserializePbData() {
    $('#display-output')[0].innerText = '';
    for (var i = 0; i < proto_data.length; i++) {
        Object.entries(ConstructorsDict).forEach(([key, value]) => {
            try {
                //console.log(proto_data[i].data);
                var message = new ConstructorsDict[key].deserializeBinary(proto_data[i].data);
                $('#display-output')[0].innerText += key + ":\n" + JSON.stringify(message.toObject(), null, 4);
                $('#display-output')[0].innerText += "\n\n*****************************************************\n\n";
            }
            catch (e) {
                console.log("exception:", e, "\n try another constructor");
            }
        });
    }

    $('#display-title')[0].scrollIntoView({ behavior: "smooth" });
}

// start
$(document).ready(function () {

    // init
    selectBasicColor();
    $('.drop-zone').css('background', drap_zone_bg);
    $('.drop-zone').css('border', drap_zone_border);
    
    // register ui event
    $('html').on('dragover', function (evt) {
        $('.drop-zone').css('border', drap_zone_hover_border);
    });

    $('.drop-zone').on('dragover', function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
        $(this).css('background', drap_zone_hover_bg);
        $(this).addClass("activate");
    });

    $('.drop-zone').on('dragleave', function () {
        setTimeout(function () {
            console.log('xx');
            if (!$('.drop-zone').hasClass("activate")) {
                $('.drop-zone').css('background', drap_zone_bg);
            }
        }, 10);
        $(this).removeClass("activate");
    });

    $('html').on('mouseout', function (evt) {
        $('.drop-zone').css('background', drap_zone_bg);
        $('.drop-zone').css('border', drap_zone_border);
    });


    // upload event
    // step1
    $('#drop-proto')[0].addEventListener('drop', (evt) => {
        evt.stopPropagation();
        evt.preventDefault();
        handleAddProto(evt.dataTransfer.files);
    });
    $('#upload-proto-input')[0].addEventListener('change', (evt) => {
        console.log(evt.target.files); // get file object
        handleAddProto(evt.target.files);
    });

    $('#upload-proto-button').on('click', function () {
        $('#upload-proto-input')[0].value = "";
        $('#upload-proto-input').click();
    });
    $('#drop-proto').on('click', function () {
        $('#upload-proto-input')[0].value = "";
        $('#upload-proto-input').click();
    });

    $('#clear-proto-button').on('click', function () {
        proto_list = [];
        proto_js = null;
        setUploadFileIcon('proto-icon', proto_list.length);
        showStep1Status();
    });

    $('#generate-protojs-button').on('click', function () {
        if (proto_list.length > 0) {
            if (getProtosSize() <= max_proto_size) {
                generateProtoJS();
                setGenerateProtoJSButton(true);
            }else{
                showStep1Status('.proto files exceeding 512 kb in size');
            }
        } else {
            showStep1Status();
        }
    });

    // step2
    $('#drop-pbdata')[0].addEventListener('drop', (evt) => {
        evt.stopPropagation();
        evt.preventDefault();
        handleAddPbData(evt.dataTransfer.files);
    });
    $('#upload-pbdata-input')[0].addEventListener('change', (evt) => {
        console.log(evt.target.files); // get file object
        handleAddPbData(evt.target.files);
    });

    $('#upload-pbdata-button').on('click', function () {
        $('#upload-pbdata-input')[0].value = "";
        $('#upload-pbdata-input').click();
    });
    $('#drop-pbdata').on('click', function () {
        $('#upload-pbdata-input')[0].value = "";
        $('#upload-pbdata-input').click();
    });

    $('#clear-pbdata-button').on('click', function () {
        proto_data = [];
        setUploadFileIcon('pbdata-icon', proto_data.length);
        showStep2Status();
    });

    $('#deserialize-button').on('click', function () {
        if (proto_data.length > 0 && proto_js) {
            deserializePbData();
        } else {
            showStep2Status();
        }
    });

    // output
    $('#download-output-button').on('click', function () {
        var aTag = document.createElement('a');
        var blob = new Blob([$('#display-output')[0].innerText]);
        aTag.download = 'output.json';
        aTag.href = URL.createObjectURL(blob);
        aTag.click();
        URL.revokeObjectURL(blob);
    });

    $('#clear-output-button').on('click', function () {
        $('#display-output')[0].innerText = '';
    });
});
