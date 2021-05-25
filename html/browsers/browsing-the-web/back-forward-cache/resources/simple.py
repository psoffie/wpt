CONTENT = b"""
<!doctype html>
<script src="/resources/testharness.js"></script>
<script src="/common/PrefixedLocalStorage.js"></script>
<script src="helper.sub.js"></script>
<script>

const t = async_test('Test');
runTest(
  t,
  () => {
    %s
    location.href = backUrl;
  },
  (isBFCached, observedEvents) => {
    %s
    t.done();
  }
);
</script>
"""

def main(request, response):
    response.status = (200, b"OK")
    response.headers.set(b"Content-Type", b"text/html")
    return CONTENT % (request.GET.first(b"script1", b""),request.GET.first(b"script2", b""))
