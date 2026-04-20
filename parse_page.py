import html
import json
import re
import sys

PAGE_PATTERN = re.compile(r'''<!DOCTYPE html>
<html lang="en">
  <head>.*?</head>
<body>

  <header>.*?</header>
  <section>
  (<p>(<a href="http://abstrusegoose.com/\d+">)?&laquo;&laquo; First(</a>)?&nbsp;&nbsp;&nbsp;&nbsp;(<a href="http://abstrusegoose.com/(?P<previous_id>\d+)">)?&laquo; Previous(</a>)?&nbsp;&nbsp;&nbsp;&nbsp;\|&nbsp;&nbsp;&nbsp;<a href="http://abstrusegoose.com/pseudorandom.php" >Random</a>&nbsp;&nbsp;&nbsp;\|&nbsp;&nbsp;&nbsp;(<a href="http://abstrusegoose.com/(?P<next_id>\d+)">)?Next &raquo;(<a>)?&nbsp;&nbsp;&nbsp;&nbsp;(<a href="http://abstrusegoose.com/">)?Current &raquo;&raquo;(</a>)?</p>\s*)?<h1 class="storytitle"><a href="http://abstrusegoose.com/(?P<current_id>[^"]+)">(<div align="left">)?(?P<header>[^<]*)(</div>)?</a></h1><br>
  ((<a href="(?P<image_anchor>[^"]+)"(\s+target="_blank")?\s*>)?<img( class="(?P<image_classes>[^"]+)")?(\s+title="(?P<image_title>[^"]*)")?\s+src="(?P<image_url>[^"]+)"(\s+alt="(?P<image_alt>[^+]*)")?(\s+title="(?P<image_title2>[^"]+)")?\s+width="(?P<image_width>\d+)" height="(?P<image_height>\d+)"(\s*title="(?P<image_title3>[^"]*)")? */?>(</a>)?)?\s*(<br />\s*)*\s*<div id="blog_text">(?P<blog_text>.*?)</div>
  (<p>(<a href="http://abstrusegoose.com/\d+">)?&laquo;&laquo; First(</a>)?&nbsp;&nbsp;&nbsp;&nbsp;(<a href="http://abstrusegoose.com/\d+">)?&laquo; Previous(</a>)?&nbsp;&nbsp;&nbsp;&nbsp;\|&nbsp;&nbsp;&nbsp;<a href="http://abstrusegoose.com/pseudorandom.php" >Random</a>&nbsp;&nbsp;&nbsp;\|&nbsp;&nbsp;&nbsp;(<a href="http://abstrusegoose.com/\d+">)?Next &raquo;(<a>)?&nbsp;&nbsp;&nbsp;&nbsp;(<a href="http://abstrusegoose.com/">)?Current &raquo;&raquo;(</a>)?</p>\s*)?</section>
  <footer>.*?</footer>
</body>
</html>
<!-- cached with Cache Goose -->''', re.MULTILINE | re.DOTALL)

def unescape(text):
    if text is None:
        return text
    return html.unescape(text)

def fix_url(url):
    if url is None:
        return url
    if url.startswith('http://'):
        url = 'https://' + url[len('http://'):]
    if url.startswith('https://abstrusegoose.com'):
        return url[len('https://abstrusegoose.com'):]
    return url

URL_ATTR_PATTERN = re.compile(r'''(\b(?:href|src)\s*=\s*)(["'])(.*?)\2''')

def fix_html(text):
    if text is None:
        return text
    def replace(match):
        prefix, quote, url = match.group(1), match.group(2), match.group(3)
        return f'{prefix}{quote}{fix_url(url)}{quote}'
    return URL_ATTR_PATTERN.sub(replace, unescape(text))

if __name__ == '__main__':
    pages = {}
    for path in sys.argv[1:]:
        try:
            page_id = '/'.join(path.split('/')[2:]).split('.')[0]
            with open(path) as f:
                matches = PAGE_PATTERN.match(f.read())
                if matches is None:
                    print(path, "match failed!")
                    break
                page_data = dict(matches.groupdict())
                # print(path, page_data)
                image_title = page_data['image_title'] or page_data['image_title2'] or page_data['image_title3']
                pages[page_id] = dict(
                    title=unescape(page_data['header']),
                    image_title=unescape(image_title),
                    image_url=fix_url(page_data['image_url']),
                    image_anchor=fix_url(page_data['image_anchor']),
                    image_alt=unescape(page_data['image_alt']),
                    image_width=page_data['image_width'],
                    image_height=page_data['image_height'],
                    previous_id=int(page_data['previous_id']) if page_data['previous_id'] is not None else None,
                    next_id=int(page_data['next_id']) if page_data['next_id'] is not None else None,
                    blog_text=fix_html(page_data['blog_text']),
                )
        except IOError as e:
            if hasattr(e, "errno") and e.errno == 2:
                # print(path, "not found")
                pass
            else:
                print(path, e)
                break
        except Exception as e:
            print(path, e)
            break
    print(json.dumps(pages, indent=2))
    # for pid, page in pages.items():
    #     if page['blog_text']:
    #         print(pid, page['blog_text'])
