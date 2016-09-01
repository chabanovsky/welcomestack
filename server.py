# -*- coding: utf-8 -*- 

import SimpleHTTPServer
import SocketServer
import json, requests
import os
import sys
import memcache

reload(sys)
sys.setdefaultencoding('utf-8')

se_api_url = "api.stackexchange.com/2.2/";
request_protocol = "http://"
api_key = ""
target_site = "ru.stackoverflow"

PORT = 8000
PAGE_SIZE = 10
DOCUMENT_ROOT = "/development/welcometostack"

mckey = "response"
mc = memcache.Client(['127.0.0.1:11211'], debug=0)

def fetchUsers(page_size):
    url = request_protocol + se_api_url + "users?pagesize=" + str(page_size) + "&order=desc&sort=reputation&site=" + target_site + "&key=" + api_key;
    resp = requests.get(url=url, params={})
    return json.loads(resp.text.encode('utf-8', 'replace'))

def fetchAnswers(id):
    url = request_protocol + se_api_url + "users/" + str(id) + "/answers?pagesize=5&order=desc&sort=votes&site=" + target_site + "&key=" + api_key;
    resp = requests.get(url=url, params={})
    return json.loads(resp.text.encode('utf-8', 'replace'))

def fetchQuestion(id):
    url = request_protocol + se_api_url + "questions/" + str(id) + "?order=desc&sort=activity&site=" + target_site + "&key=" + api_key;
    resp = requests.get(url=url, params={})
    return json.loads(resp.text.encode('utf-8', 'replace'))        

def fetchTags(id):
    url = request_protocol + se_api_url + "users/" + str(id) + "/top-tags?pagesize=5&site=" + target_site + "&key=" + api_key;
    resp = requests.get(url=url, params={})
    return json.loads(resp.text.encode('utf-8', 'replace'))
    
# '{"id":"", "username":"", "reputation":"", "avatar":"", "answers":[{"id":"", "title": "", "score":""},{"id":"","title":"","score":""}],"tags":["java","c++","c","c#","qt"]}';
def fetchData(page_size):
    cache = mc.get(mckey+str(page_size))
    if cache is not None:
        print "Using cache as the response"
        return cache;
    response = list()
    users = fetchUsers(page_size).get('items', dict())
    for index in range(0, len(users)):
        user = users[index]
        id = user['user_id']
        username = user['display_name']
        reputation = user['reputation']
        avatar = user['profile_image']
        
        answer_list = list();
        answer_resp = fetchAnswers(id)['items']
        for answer_index in range(0, len(answer_resp)):
            answer = answer_resp[answer_index]
            answer_id = answer['answer_id']
            score = answer['score']
            question_id = answer['question_id']

            question = fetchQuestion(question_id)['items'][0]
            title = question['title']

            answer_list.append({
                "id": answer_id,
                "score": score,
                "title": title
            }) 

        tag_list = list()
        tag_resp = fetchTags(id)['items']
        for tag_index in range(0, len(tag_resp)):
            tag = tag_resp[tag_index]
            tag_name = tag['tag_name']

            tag_list.append(tag_name)

        response.append({
            "id": id,
            "username": username,
            "reputation": reputation,
            "avatar": avatar,
            "answers": answer_list,
            "tags": tag_list
        })
    result = json.dumps(response)
    print mc.set(mckey+str(page_size), result, time=3600)    
    return result
                
class CustomHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/json/users' or self.path == '/json/users/init':
            self.send_response(200)
            self.send_header('Content-type','application/json')
            self.end_headers()
            if self.path=='/json/users/init':
                self.wfile.write(fetchData(1)) 
            else:
                 self.wfile.write(fetchData(PAGE_SIZE))
            return
        else:
            SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)            

if __name__ == "__main__":
    os.chdir("./static/")
    httpd = SocketServer.TCPServer(("", PORT), CustomHandler)
    print "serving at port", PORT
    httpd.serve_forever()
    quit()

sys.path.append(DOCUMENT_ROOT)

def get_index():
    f = open(DOCUMENT_ROOT +'/static/index.html', 'r')
    data = f.read()
    f.close()
    return data

def application(environ, start_response):
    output = ""
    status = "200 OK"
    content_type = "text/plain"
    path = environ.get('PATH_INFO', None)

    if path == '/' or path == "index.html":
        output = get_index()
        content_type = 'text/html'
    elif path == '/json/users':
        content_type = 'application/json'
        output = fetchData(PAGE_SIZE)
    elif path == '/json/users/init':
        content_type = 'application/json'
        output = fetchData(1)
    
    if output == "":    
        status = "404 Not Found"
        output = "Not Found"

    response_headers = [('Content-type', content_type),
                        ('Content-Length', str(len(output)))]
    start_response(status, response_headers)

    return [output]