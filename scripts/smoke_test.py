"""Real HTTP smoke test. Run against the backend at localhost:8080."""
import json
import urllib.request
import urllib.error

BASE = 'http://localhost:8080/api/tasks'

def call(method, path='', data=None, expected=200, headers=None):
    request = urllib.request.Request(BASE + path,
        data=json.dumps(data).encode() if data is not None else None,
        headers={'Content-Type': 'application/json', **(headers or {})}, method=method)
    try:
        response = urllib.request.urlopen(request, timeout=10)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        body = response.read()
        assert response.status == expected, (method, path, response.status, body)
        result = json.loads(body) if body else None
        if expected >= 400:
            assert result['status'] == expected and result['message']
        return result, response.headers

call('GET')
task, headers = call('POST', data={'title': 'Smoke test task', 'description': 'Live Docker verification'}, expected=201)
path = '/' + str(task['id'])
try:
    assert task['status'] == 'TODO'
    assert headers['Location'] == '/api/tasks' + path
    assert call('GET', path)[0]['title'] == 'Smoke test task'
    updated, _ = call('PUT', path, {'title': 'Updated smoke task', 'status': 'DONE'})
    assert updated['status'] == 'DONE'
    assert any(t['id'] == task['id'] for t in call('GET')[0])
    for payload in ({'title': 'ab'}, {'title': '   '}, {'title': 'x' * 101}, {'title': 'Valid', 'description': 'x' * 501}, {'title': 'Valid', 'status': 'WRONG'}, {'title': 'Valid', 'status': 0}):
        call('POST', data=payload, expected=400)
    call('PUT', path, {'title': 'x'}, expected=400)
    call('GET', '/abc', expected=400)
    _, cors = call('OPTIONS', path, headers={'Origin': 'http://localhost:5173', 'Access-Control-Request-Method': 'PUT'})
    assert cors['Access-Control-Allow-Origin'] == 'http://localhost:5173'
finally:
    call('DELETE', path, expected=204)
call('GET', path, expected=404)
call('PUT', path, {'title': 'Missing task'}, expected=404)
call('DELETE', path, expected=404)
print('PASS: live container CRUD, validation, default status, Location, CORS, and 404 responses')
