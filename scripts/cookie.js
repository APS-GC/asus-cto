/**
 * Cookie tools
 * eg.  setCookie('theme', 'dark', { maxAge: 3600, sameSite: 'Lax' });
 */
export function setCookie(name, value, options = {}) {
    const opts = {
        path: '/',
        ...options
    };

    let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (opts.expires instanceof Date) {
        cookieStr += `; expires=${opts.expires.toUTCString()}`;
    } else if (typeof opts.maxAge === 'number') {
        cookieStr += `; max-age=${opts.maxAge}`;
    }

    if (opts.domain) {
        cookieStr += `; domain=${opts.domain}`;
    }
    if (opts.path) {
        cookieStr += `; path=${opts.path}`;
    }
    if (opts.secure) {
        cookieStr += '; secure';
    }
    if (opts.sameSite) {
        cookieStr += `; samesite=${opts.sameSite}`;
    }

    document.cookie = cookieStr;
}


export function getCookie(name) {
    const matches = document.cookie.match(
        new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[]\\\/\+^])/g, '\\$1')}=([^;]*)`)
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

export function deleteCookie(name, options = {}) {
    setCookie(name, '', {
        ...options,
        maxAge: -1
    });
}

export function clearAllCookies(domain) {
    document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${
            domain ? `; domain=${domain}` : ''
        }; path=/`;
    });
}


