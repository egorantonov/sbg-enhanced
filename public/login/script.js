;(async function() {
    let error_timeout
    window.onTelegramAuth = async (data) => {
        const request = await fetch('/api/auth', {
            method: 'post',
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json',
                'accept-language': LANG
            }
        }).catch(() => {
            $('#telegram-login-sbg_game_bot').before($('<div>', {
                class: 'form__error',
                text: i18next.t('network-fail')
            }))
        })
        if (typeof request === 'undefined') return
        const response = await request.json()
        if (response.error || request.status !== 200) {
            $('#telegram-login-sbg_game_bot').before($('<div>', {
                class: 'form__error',
                text: response.error || response.reason
            }))
            return
        }
        if (!response.token) return showForm(data)
        localStorage.setItem('auth', response.token)
        location.href = '/'
    }
    function showForm(data, classic = false) {
        $('.auth-button').remove()
        $('.form').removeClass('hidden')

        $('#form__register-pass, #form__register-pass-rep').on('input', () => {
            const pass_orig = $('#form__register-pass').val()
            const pass_rep = $('#form__register-pass-rep').val()
            $('#form__buttons-register')[0].setCustomValidity((pass_rep != pass_orig) ? i18next.t('password-match') : '')
        })

        if (classic) {
            $('.form__register, .no-account').remove()
            $('.form').css('grid-template-columns', '1fr')
            $('.form__login h2').text(i18next.t('header-login')).css('text-align', 'center')
        }

        $('form').on('submit', async event => {
            const form = $(event.target)
            const submit = form.find('button[type="submit"]')
            event.target.checkValidity()
            event.preventDefault()
            submit.prop('disabled', true)
            const form_data = {}
            $(event.target).serializeArray().forEach(e => form_data[e.name] = e.value)
            $.ajax({
                method: form.attr('method'),
                url: form.attr('action'),
                data: JSON.stringify({
                    ...form_data,
                    tg: data,
                    mode: classic
                }),
                headers: {
                    'content-type': 'application/json',
                    'accept-language': LANG
                }
            }).done(json => {
                if (json.error) {
                    submit.prop('disabled', false)
                    clearTimeout(error_timeout)
                    form.append($('<div>', {
                        class: 'form__error',
                        text: json.error
                    }))
                    error_timeout = setTimeout(() => {
                        $('.form__error').remove()
                    }, 5000)
                    return
                }
                localStorage.setItem('auth', json.t)
                if (!classic) localStorage.setItem('tg-linked', true)
                location.href = '/'
            })
        })
    }

    const cached_lang = JSON.parse(localStorage.getItem('settings'))?.lang || 'sys'
    const LANG = cached_lang == 'sys' ? navigator.language : cached_lang
    const META = await (await fetch('/i18n/meta.json')).json()
    await i18next.use(i18nextChainedBackend).init({
        lng: LANG,
        supportedLngs: META.supported,
        fallbackLng: META.fallbacks,
        backend: {
            backends: [i18nextLocalStorageBackend, i18nextHttpBackend],
            backendOptions: [{ prefix: 'i18next_' }, { loadPath: '/i18n/{{lng}}/login.json' }]
        },
        defaultNs: 'login',
        ns: ['login'],
        load: 'languageOnly'
    })
    jqueryI18next.init(i18next, $, { useOptionsAttr: true })
    $('html').attr('lang', LANG)
    $('body').localize()
    $('title').text(i18next.t('page-title'))
    $('.auth-button').prepend($('<script>', {
        async: 1,
        src: 'https://telegram.org/js/telegram-widget.js?21',
        'data-telegram-login': 'sbg_game_bot',
        'data-size': 'large',
        'data-userpic': false,
        'data-onauth': 'onTelegramAuth(user)',
        'data-request-access': 'write',
        'data-lang': LANG
    }))
    $('#classic-login').on('click', () => showForm({}, true))
})();