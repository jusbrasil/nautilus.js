function loadScript(config, currentQueue) {
  var origins = config.origins;
  var pathIsArray = _.isArray(config.path);
  var paths = pathIsArray ? config.path : [];
  var path = pathIsArray ? config.path[0] : config.path;
  var scr = document.createElement('script');
  var useOrigins = origins.length > 0 && !_.isAbsoluteURL(path);
  var src = useOrigins ? origins[0] + path : path;

  scr.type = 'text/javascript';
  scr.onload = handleLoad;
  scr.async = true;
  scr.onreadystatechange = handleReadyStateChange;
  scr.onerror = handleError;
  scr.src = src;
  document.head.appendChild(scr);

  var timeoutID = window.setTimeout(function () {
    document.head.removeChild(scr);
    scr.onerror = null;
    handleError();
  }, config.timeout);

  function handleLoad() {
    window.clearTimeout(timeoutID);
    queue.incr(currentQueue);
  }

  function handleReadyStateChange() {
    if (scr.readyState === 'complete') {
      handleLoad();
    }
  }

  function handleError() {
    console.warn(
      '[nautilus] occurred an error while fetching',
      src
    );
    if (useOrigins) {
      loadScript(_.merge(config, {
        origins: origins.slice(1),
      }), currentQueue);
    }
    if (paths.length > 1) {
      loadScript(_.merge(config, {
        path: paths.slice(1),
      }), currentQueue);
    }
  }
}

function fetchBuiltIn(arr) {
  fetch.apply(this, arr)
}

function fetch() {
  var args = Array.prototype.slice.call(arguments);
  var paths = args[0];
  if (typeof(paths) === 'string') {
    paths = [paths];
  }

  if (_.isArray(args[1])) {
    args[1] = fetchBuiltIn.bind(this, args.slice(1, args.length));
  }

  var q = queue.push(paths.length, args[1]);
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    loadScript({
      origins: uOrigins,
      path: uPaths[path] || path,
      timeout: uTimeout
    }, q);
  }
}

this.config = function (settings) {
  if (_.isArray(settings.origins)) {
    uOrigins = uOrigins.concat(settings.origins);
  }
  if (typeof(settings.paths) === 'object') {
    uPaths = _.merge(uPaths, settings.paths);
  }
  if (typeof settings.timeout === 'number') {
    uTimeout = settings.timeout;
  }
};

this.getConfig = function () {
  return {
    origins: uOrigins,
    paths: uPaths,
    timeout: uTimeout
  }
};

this.resetConfig = function () {
  uOrigins = [];
  uPaths = {};
  uTimeout = Math.pow(2, 31) - 1;
  queue.reset();
};
