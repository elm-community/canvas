var _elm_community$canvas$Native_Canvas = function () {

  function LOG(msg) {
    // console.log(msg);
  }

  var liveCanvases = { };


  function randomHex() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }


  function makeUUID() {
    var output = ""
    for (var charIndex = 0; charIndex < 20; charIndex++) {
      output = output + randomHex();
    }
    return output
  }


  function makeModel(canvas) {

    // The elm debugger crashes when it tries to
    // traverse an html object. So instead
    // of passing along a canvas element, we
    // pass along a function that returns it
    function getCanvas() {
      return canvas;
    }

    return {
      ctor: 'Canvas',
      canvas: getCanvas,
      width: canvas.width,
      height: canvas.height
    }
  }

  // This is how we ensure immutability.
  // Canvas elements are never modified
  // and passed along. They are copied,
  // and the clone is passed along.
  function cloneModel(model) {

    var canvas = document.createElement("canvas");
    canvas.width = model.width;
    canvas.height = model.height;

    var ctx = canvas.getContext('2d')
    ctx.drawImage(model.canvas(), 0, 0);

    return makeModel(canvas);

  }


  function initialize(size) {

    var canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;

    return makeModel(canvas);

  }


  function batch(drawOps, model) {
    model = cloneModel(model);

    var ctx = model.canvas().getContext('2d');

    while (drawOps.ctor !== "[]") {
      handleDrawOp(ctx, drawOps._0);

      drawOps = drawOps._1;
    }

    return model;
  }

  function handleDrawOp (ctx, drawOp) {
    switch (drawOp.ctor) {
      case "Font" :
        ctx.font = drawOp._0;
        break;

      case "StrokeText" :
        var position = drawOp._1;

        ctx.strokeText(drawOp._0, position.x, position.y)
        break;

      case "FillText" :
        var position = drawOp._1;

        ctx.fillText(drawOp._0, position.x, position.y)
        break;

      case "GlobalAlpha" :
        ctx.globalAlpha = drawOp._0;
        break;

      case "GlobalCompositionOp" :
        // This converts the type from camel case to dash case.
        var op = drawOp._0.ctor.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

        ctx.globalCompositeOperation = op;
        break;

      case "LineCap" :
        var cap = drawOp._0.ctor.toLowerCase();

        ctx.lineCap = cap;
        break;

      case "LineWidth" :
        ctx.lineWidth = drawOp._0;
        break;

      case "LineTo" :
        var position = drawOp._0;

        ctx.lineTo(position.x, position.y);
        break;

      case "MoveTo" :
        var position = drawOp._0;

        ctx.moveTo(position.x, position.y);
        break;

      case "Stroke" :
        ctx.stroke();
        break;

      case "BeginPath" :
        ctx.beginPath()
        break;

      case "Rect" :
        var position = drawOp._0;
        var size = drawOp._1;

        ctx.rect(position.x, position.y, size.width, size.height);
        break;

      case "StrokeRect" :
        var position = drawOp._0;
        var size = drawOp._1;

        ctx.strokeRect(position.x, position.y, size.width, size.height);
        break;

      case "StrokeStyle" :

        var color = _elm_lang$core$Color$toRgb(drawOp._0);

        var cssString =
          'rgba(' + color.red +
          ',' + color.green +
          ',' + color.blue +
          ',' + color.alpha +
          ')';

        ctx.strokeStyle = cssString;
        break;


      case "FillStyle" :

        var color = _elm_lang$core$Color$toRgb(drawOp._0);

        var cssString =
          'rgba(' + [ color.red, color.green, color.blue, color.alpha ].join(',') + ')';


        ctx.fillStyle = cssString;
        break;

      case "Fill" :

        ctx.fill();
        break;

      case "PutImageData" :

        var position = drawOp._2;
        var size = drawOp._1;
        var data = _elm_lang$core$Native_Array.toJSArray(drawOp._0);

        var imageData = ctx.createImageData(size.width, size.height);

        for (var index = 0; index < data.length; index++) {
          imageData.data[ index ] = data[ index ];
        }

        ctx.putImageData(imageData, position.x, position.y);
        break;

      case "ClearRect" :

        var position = drawOp._0;
        var size = drawOp._1;

        ctx.clearRect(position.x, position.y, size.width, size.height);

      case "DrawImage":

        var srcCanvas = drawOp._0.canvas()
        var drawImageOp = drawOp._1

        switch (drawOp._1.ctor) {
          case "At":

            var destPosition = drawImageOp._0
            ctx.drawImage(
              srcCanvas,
              destPosition.x,
              destPosition.y
            )
            break;

          case "Scaled":

            var destPosition = drawImageOp._0
            var destSize = drawImageOp._1
            ctx.drawImage(
              srcCanvas,
              destPosition.x, destPosition.y,
              destSize.width, destSize.height
            )
            break;

          case "CropScaled":

            var srcPosition = drawImageOp._0
            var srcSize = drawImageOp._1
            var destPosition = drawImageOp._2
            var destSize = drawImageOp._3
            ctx.drawImage(
              srcCanvas,
              srcPosition.x, srcPosition.y,
              srcSize.width, srcSize.height,
              destPosition.x, destPosition.y,
              destSize.width, destSize.height
            )
            break
        }

        break;
    }
  }


  function loadImage(source) {
    LOG("LOAD IMAGE");

    var Scheduler = _elm_lang$core$Native_Scheduler;
    return Scheduler.nativeBinding(function (callback) {
      var img = new Image();

      img.onload = function () {
        var canvas = document.createElement('canvas');

        canvas.width = img.width;
        canvas.height = img.height;

        var ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0);

        callback(Scheduler.succeed(makeModel(canvas)));
      };

      img.onerror = function () {
        callback(Scheduler.fail({ ctor: 'Error' }));
      };

      if (source.slice(0,5) !== "data:") {
        img.crossOrigin = "Anonymous";
      }
      img.src = source;
    });
  }


  function getImageData(model) {
    LOG("GET IMAGE DATA");

    var canvas = model.canvas();

    var ctx = canvas.getContext('2d');

    var imageData = ctx.getImageData(0, 0, model.width, model.height);

    return _elm_lang$core$Native_Array.fromJSArray(imageData.data);
  }

  function setSize(size, model) {
    model = cloneModel(model);
    model.width = size.width;
    model.height = size.height;

    return model;
  }


  function getSize(model) {
    return {
      width: model.width,
      height: model.height
    };
  }


  function toHtml(factList, model) {
    LOG("TO HTML")

    return _elm_lang$virtual_dom$Native_VirtualDom.custom(factList, model, implementation);

  }

  var implementation = {
    render: renderCanvas,
    diff: diff
  }

  function renderCanvas(model) {
    LOG('RENDER CANVAS');
    return cloneModel(model).canvas();
  }


  function diff(old, new_) {
    LOG("DIFF")

    var diffCanvases = old.model.canvas() !== new_.model.canvas()
    console.log(diffCanvases);

    return {
      applyPatch: function(domNode, data) {
        LOG("APPLY PATCH");

        if (diffCanvases) {

          var model = data.model;

          domNode.width = model.width;
          domNode.height = model.height;

          var ctx = domNode.getContext('2d');
          ctx.clearRect(0, 0, domNode.width, domNode.height);
          ctx.drawImage(data.model.canvas(), 0, 0);
        }

        return domNode;

      },
      data: new_
    };

  }

  return {
    initialize: initialize,
    setSize: F2(setSize),
    getSize: getSize,
    loadImage: loadImage,
    toHtml: F2(toHtml),
    getImageData: getImageData,
    clone: cloneModel,
    batch: F2(batch)
  };
}();
