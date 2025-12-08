/**
 * Cookie tools
 * eg.  setCookie('theme', 'dark', { maxAge: 3600, sameSite: 'Lax' });
 */
export function setCookie(name, value, options = {}) {
    options = {
        path: '/',
        ...options
    };

    let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires instanceof Date) {
        cookieStr += `; expires=${options.expires.toUTCString()}`;
    } else if (typeof options.maxAge === 'number') {
        cookieStr += `; max-age=${options.maxAge}`;
    }

    if (options.domain) {
        cookieStr += `; domain=${options.domain}`;
    }
    if (options.path) {
        cookieStr += `; path=${options.path}`;
    }
    if (options.secure) {
        cookieStr += '; secure';
    }
    if (options.sameSite) {
        cookieStr += `; samesite=${options.sameSite}`;
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


