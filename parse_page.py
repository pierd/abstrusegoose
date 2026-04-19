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
                pages[page_id] = dict(
                    image_title=page_data['image_title'] or page_data['image_title2'] or page_data['image_title3'],
                    image_url=page_data['image_url'],   # FIXME
                    image_anchor=page_data['image_anchor'], # FIXME
                    image_alt=page_data['image_alt'],
                    image_width=page_data['image_width'],
                    image_height=page_data['image_height'],
                    previous_id=int(page_data['previous_id']) if page_data['previous_id'] is not None else None,
                    next_id=int(page_data['next_id']) if page_data['next_id'] is not None else None,
                    blog_text=page_data['blog_text'],   # FIXME
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
    print(pages)
    # for pid, page in pages.items():
    #     if page['blog_text']:
    #         print(pid, page['blog_text'])
