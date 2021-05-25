// A helper script for simple A->B->A navigation scenarios like:
// 1. Initial navigation to `A.html`.
// 2. Navigation to `B.html`.
// 3. Back navigation to `A.html`, assuming `A.html` is (or is not) in BFCache.

// This script is loaded from `A.html`.

// `A.html` should be opened using `PrefixedLocalStorage.url()`, because
// `/common/PrefixedLocalStorage.js` is used to save states across navigations.

window.prefixedLocalStorage = new PrefixedLocalStorageResource({
  close_on_cleanup: true
});

// Starts an A->B->A navigation test. This should be called on `A.html`.
// `onStart()` is called on the initial navigation, which is expected to
// initiate a navigation to a page (`B.html`) that will eventually back
// navigate to `A.html`.
// `onBackNavigated(isBFCached, observedEvents)` is called on back navigation.
// - `isBFCached` indicates whether the back navigation is from BFCache or not,
//   based on events fired.
// - `observedEvents` is an array of event labels fired on `A.html`,
//   if `startRecordingEvents()` is called.
function runTest(test, onStart, onBackNavigated) {
  window.addEventListener('load', () => {
    if (prefixedLocalStorage.getItem('state') === null) {
      // Initial navigation.
      prefixedLocalStorage.setItem('state', 'started');

      // Call `onStart()` (and thus starting navigation) after this document
      // is fully loaded.
      // `step_timeout()` is used here because starting the navigation
      // synchronously inside the window load event handler seems to
      // cause back navigation to this page to fail on Firefox.
      test.step_timeout(() => {
        window.addEventListener('pageshow', (() => {
          // Back navigation, from BFCache.
          test.step(
            onBackNavigated,
            undefined,
            true,
            prefixedLocalStorage.getPushedItems('observedEvents'));
        }));
        test.step(onStart);
      }, 0);
    } else {
      // Back navigation, not from BFCache.
      test.step(
        onBackNavigated,
        undefined,
        false,
        prefixedLocalStorage.getPushedItems('observedEvents'));
    }
  });
}

// Records events fired on `window` and `document`, with names listed in
// `eventNames`.
// The recorded events are stored in localStorage and used later in the
// runTest() callback.
function startRecordingEvents(eventNames) {
  window.testObservedEvents = [];
  for (const eventName of eventNames) {
    window.addEventListener(eventName, event => {
      let result = eventName;
      if (event.persisted) {
        result += '.persisted';
      }
      if (eventName === 'visibilitychange') {
        result += '.' + document.visibilityState;
      }
      prefixedLocalStorage.pushItem('observedEvents', 'window.' + result);
    });
    document.addEventListener(eventName, () => {
      let result = eventName;
      if (eventName === 'visibilitychange') {
        result += '.' + document.visibilityState;
      }
      prefixedLocalStorage.pushItem('observedEvents', 'document.' + result);
    });
  }
}

const originParam = new URL(location.href).searchParams.get('origin');

const origin =
  originParam === 'same-origin' ? 'http://{{host}}:{{ports[http][0]}}' :
  originParam === 'same-site' ? 'http://{{host}}:{{ports[http][1]}}' :
  'http://{{hosts[alt][www]}}:{{ports[http][0]}}'; // cross-site

const backUrl =
  origin +
  '/html/browsers/browsing-the-web/back-forward-cache/resources/back.html';
