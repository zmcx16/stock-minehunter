'use strict';

const bg_color = [  { 'bg1': 'aliceblue', 'bg2': 'rgb(255,251,248)' },
                    { 'bg1': 'cornsilk', 'bg2': 'cornsilk' },
                    { 'bg1': 'honeydew', 'bg2': 'honeydew' },
                    { 'bg1': 'mintcream', 'bg2': 'mintcream' },
                    { 'bg1': 'snow', 'bg2': 'snow' }];

function selectBasicColor()
{
    var select = Math.floor(Math.random() * bg_color.length);
    $('body').css('background-color', bg_color[select].bg1);
    $('.wrapper-0').css('background', bg_color[select].bg2);
}


// start
$(document).ready(function () {

    // init
    selectBasicColor();
    var stretchHeight = window.innerHeight - ($(".wrapper").height() - $("#display-output").height());
    $("#display-output").css("min-height", stretchHeight);
});
