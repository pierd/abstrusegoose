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

URL_ATTR_PATTERN = re.compile(r'''(\b(?:href|src|value)\s*=\s*)(["'])(.*?)\2''')
BARE_URL_PATTERN = re.compile(r'''(?<!=["'])http://\S+''')

def fix_html(text):
    if text is None:
        return text
    def replace_attr(match):
        prefix, quote, url = match.group(1), match.group(2), match.group(3)
        return f'{prefix}{quote}{fix_url(url)}{quote}'
    text = URL_ATTR_PATTERN.sub(replace_attr, text)
    text = BARE_URL_PATTERN.sub(lambda m: fix_url(m.group()), text)
    return text


# Flash video players (<object>/<embed> with .swf) no longer work in any
# browser. YouTube ones become regular iframe embeds; Google Video (shut down
# in 2012) ones become a note pointing to where the video can be found.
YOUTUBE_OBJECT_PATTERN = re.compile(
    r'<object width="(\d+)" height="(\d+)">.*?'
    r'https://www\.youtube(?:-nocookie)?\.com/v/([A-Za-z0-9_-]{11}).*?</object>',
    re.DOTALL,
)
GOOGLE_VIDEO_EMBED_PATTERN = re.compile(
    r'<embed[^>]*googleplayer\.swf\?docid=(-?\d+)[^>]*>(?:\s*</embed>)?'
)
GOOGLE_VIDEO_REPLACEMENTS = {
    # Strip 65: "Dangerous Knowledge" (BBC, 2007), parts 1 and 2.
    '-8492625684649921614': 'Dangerous Knowledge (BBC, 2007)',
    '-1663091361786740235': 'Dangerous Knowledge (BBC, 2007)',
}


def replace_flash_videos(text):
    def youtube(match):
        width, height, video_id = match.groups()
        return (
            f'<iframe width="{width}" height="{height}" '
            f'src="https://www.youtube-nocookie.com/embed/{video_id}" '
            'title="YouTube video" frameborder="0" loading="lazy" '
            'allow="fullscreen; picture-in-picture" allowfullscreen></iframe>'
        )

    def google_video(match):
        docid = match.group(1)
        if docid not in GOOGLE_VIDEO_REPLACEMENTS:
            raise ValueError(f'unknown Google Video docid {docid}')
        title = GOOGLE_VIDEO_REPLACEMENTS[docid]
        slug = title.split(' (')[0].replace(' ', '_')
        return (
            '<em>(video no longer available: Google Video has shut down; see '
            f'<a href="https://en.wikipedia.org/wiki/{slug}">{title}</a>)</em>'
        )

    text = YOUTUBE_OBJECT_PATTERN.sub(youtube, text)
    return GOOGLE_VIDEO_EMBED_PATTERN.sub(google_video, text)


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

    # Some later strips (games, interactive comics) embed an <iframe> in place
    # of the comic image. Its src is relative to the strip page (i.e. the
    # site root), so make it root-absolute.
    iframe_url = None
    iframe_width = None
    iframe_height = None
    iframe = section.find('iframe')
    if iframe is not None and not iframe.find_parent('div', id='blog_text'):
        src = fix_url(iframe.get('src'))
        if src and not src.startswith(('/', 'https://')):
            src = '/' + src
        iframe_url = src
        iframe_width = iframe.get('width')
        iframe_height = iframe.get('height')

    # Extract blog_text inner HTML using regex on raw content to preserve
    # original HTML formatting (BeautifulSoup normalizes br tags, attribute
    # order, etc. which changes the output)
    blog_text = ''
    blog_text_match = re.search(
        r'<div id="blog_text">(.*?)</div>', content, re.DOTALL
    )
    if blog_text_match:
        blog_text = replace_flash_videos(
            fix_html(unescape(blog_text_match.group(1)))
        ).strip()

    return dict(
        title=title,
        image_title=unescape(image_title),
        image_url=image_url,
        image_anchor=image_anchor,
        image_alt=unescape(image_alt),
        image_width=image_width,
        image_height=image_height,
        iframe_url=iframe_url,
        iframe_width=iframe_width,
        iframe_height=iframe_height,
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
                    print(path, "match failed!", file=sys.stderr)
                    sys.exit(1)
                pages[page_id] = result
        except FileNotFoundError:
            # Expected: the {1..611} range includes ids the site never had.
            pass
        except Exception as e:
            print(path, e, file=sys.stderr)
            sys.exit(1)
    print(json.dumps(pages, indent=2))
