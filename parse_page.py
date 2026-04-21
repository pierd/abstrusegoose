import html
import json
import re
import sys

from bs4 import BeautifulSoup


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
    return URL_ATTR_PATTERN.sub(replace, text)


def parse_page(content):
    soup = BeautifulSoup(content, 'html.parser')

    section = soup.find('section')
    if section is None:
        return None

    # Find the story title h1
    h1 = section.find('h1', class_='storytitle')
    if h1 is None:
        return None

    # Extract current_id and title from h1 > a
    title_link = h1.find('a')
    if title_link is None:
        return None

    title = title_link.get_text()

    # Find the comic image (the main img in the section, not in header/footer)
    # It's the img tag that's a sibling of h1 (after it), typically with src containing "strips/"
    # or just the first img in section that's not inside a nav/p element
    blog_text_div = section.find('div', id='blog_text')
    if blog_text_div is None:
        return None

    # Find the img tag: it should be between h1 and blog_text_div
    # Look for img tags that are direct or near-direct children of section
    img = None
    # The img might be wrapped in an <a> tag
    # Search for all img tags in section that are NOT inside the nav <p> elements
    for candidate in section.find_all('img'):
        # Skip images inside nav paragraphs (they wouldn't have width/height typically)
        parent_p = candidate.find_parent('p')
        if parent_p:
            continue
        # Skip images inside blog_text
        if candidate.find_parent('div', id='blog_text'):
            continue
        img = candidate
        break

    # Extract navigation info (previous_id and next_id) from the first <p> nav bar
    previous_id = None
    next_id = None
    nav_p = section.find('p')
    if nav_p:
        nav_links = nav_p.find_all('a')
        for link in nav_links:
            href = link.get('href', '')
            link_text = link.get_text()
            if 'Previous' in link_text:
                # Extract the ID from the URL
                match = re.search(r'/(\d+)$', href)
                if match:
                    previous_id = int(match.group(1))
            elif 'Next' in link_text:
                match = re.search(r'/(\d+)$', href)
                if match:
                    next_id = int(match.group(1))

    # Extract image data
    image_title = None
    image_url = None
    image_anchor = None
    image_alt = None
    image_width = None
    image_height = None

    if img:
        image_title = img.get('title')
        if image_title is None:
            pass  # no title attribute
        elif image_title == '':
            image_title = ''  # explicitly empty title=""
        image_url = fix_url(img.get('src'))
        image_alt = img.get('alt')
        image_width = img.get('width')
        image_height = img.get('height')

        # Check if image is wrapped in an anchor
        parent = img.parent
        if parent and parent.name == 'a':
            image_anchor = fix_url(parent.get('href'))

    # Extract blog_text inner HTML using regex on raw content to preserve
    # original HTML formatting (BeautifulSoup normalizes br tags, attribute
    # order, etc. which changes the output)
    blog_text = ''
    blog_text_match = re.search(
        r'<div id="blog_text">(.*?)</div>', content, re.DOTALL
    )
    if blog_text_match:
        blog_text = fix_html(unescape(blog_text_match.group(1))).strip()

    return dict(
        title=title,
        image_title=unescape(image_title),
        image_url=image_url,
        image_anchor=image_anchor,
        image_alt=unescape(image_alt),
        image_width=image_width,
        image_height=image_height,
        previous_id=previous_id,
        next_id=next_id,
        blog_text=blog_text,
    )


if __name__ == '__main__':
    pages = {}
    for path in sys.argv[1:]:
        try:
            page_id = '/'.join(path.split('/')[2:]).split('.')[0]
            with open(path) as f:
                result = parse_page(f.read())
                if result is None:
                    print(path, "match failed!")
                    break
                pages[page_id] = result
        except IOError as e:
            if hasattr(e, "errno") and e.errno == 2:
                pass
            else:
                print(path, e)
                break
        except Exception as e:
            print(path, e)
            break
    print(json.dumps(pages, indent=2))
