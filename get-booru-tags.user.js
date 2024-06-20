// ==UserScript==
// @name         Get Booru Tags with Enhanced Tag Ordering
// @namespace    https://github.com/onusai/
// @version      0.5.1
// @description  Press the [~] tilde key under ESC to open a prompt with all tags including improved tag ordering
// @author       Onusai#6441
// @match        https://gelbooru.com/index.php?page=post&s=view*
// @match        https://safebooru.donmai.us/posts/*
// @match        https://danbooru.donmai.us/posts/*
// @match        https://aibooru.online/posts/*
// @grant        none
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    let include_commas = true;
    let remove_underscores = true;
    let remove_parentheses = false;
    let randomize_tag_order = false;
    let escape_colons = false;

    // Updated tag group order with "special_tags" as a custom category for enhanced ordering
    // let tag_group_order = ["special_tags", "character", "copyright", "artist", "general"];
    let tag_group_order = ["special_tags", "character", "copyright", "general"];

    let hotkey_default = '`';
    let hotkey_1 = '1';

    let special_tags = [
        "1girl", "2girls", "3girls", "4girls", "5girls", "6+girls", "multiple girls",
        "1boy", "2boys", "3boys", "4boys", "5boys", "6+boys", "multiple boys", "male focus",
        "1other", "2others", "3others", "4others", "5others", "6+others", "multiple others", "other focus",
    ];

    let blacklist_tags = [
        ".*background",
        ".*text.*",
        ".*blurry.*",
        "comic",
        ".*manga.*",
        ".*magazine.*",
        ".*username.*",
        "artist name",
        "lowres",
        "bad anatomy",
        "bad hands",
        "text",
        "error",
        "missing fingers",
        "extra digit",
        "fewer digits",
        "cropped",
        "jpeg artifacts",
        "signature",
        "watermark",
        "username",
        "blurry",
        "artist name"
    ];

    let keysPressed = {};

    $(document).on('keyup', (event) => {
        if (event.key == hotkey_default) show_prompt(randomize_tag_order);
    });

    $(document).on('keydown', (event) => {
        keysPressed[event.key] = true;
        if (!keysPressed[hotkey_default]) return;
        if (event.key == hotkey_1) show_prompt(true);
    });

    function show_prompt(randomize=false) {
        for (var member in keysPressed) delete keysPressed[member];

        let tags = null;
        let url = window.location.href;
        if (url.includes("/gelbooru.com")) tags = get_gel_tags(randomize);
        else if (url.includes("/danbooru.donmai.us") || url.includes("/safebooru.donmai.us") || url.includes("/aibooru.online")) tags = get_dan_tags(randomize);
        if (!tags) return;

        // Filter out blacklisted tags using regex
        tags = tags.filter(tag => !blacklist_tags.some(pattern => new RegExp(pattern).test(tag)));

        // New: Reordering based on special_tags criteria before displaying
        tags = reorder_tags_based_on_special_criteria(tags);

        let tag_count = tags.length;

        for (var i = 0; i < tag_count; i++) {
            if (remove_underscores) tags[i] = tags[i].replaceAll("_", " ");
            else tags[i] = tags[i].replaceAll(" ", "_");
        }

        tags = tags.join(", ");
        if (!include_commas) tags = tags.replaceAll(",", "");
        if (escape_colons) tags = tags.replaceAll(":", ":\\");
        if (remove_parentheses) tags = tags.replaceAll("(", "").replaceAll(")", "");
        else tags = tags.replaceAll("(", "\\(").replaceAll(")", "\\)");

        prompt("Prompt: " + tag_count + " tags", tags);
    }

    function reorder_tags_based_on_special_criteria(tags) {
        // Separating general tags and filtering special tags to the front
        let generalTags = tags.filter(tag => tag_group_order.includes("general") && special_tags.includes(tag));
        let otherTags = tags.filter(tag => !special_tags.includes(tag));

        // Ordering general tags based on special_tags order
        let orderedGeneralTags = special_tags.filter(tag => generalTags.includes(tag));

        // Combine the ordered general tags with the rest of the tags
        return [...orderedGeneralTags, ...otherTags];
    }

    function get_gel_tags(randomize=false) {
        let tags = [];
        for (let group of tag_group_order) {
            let group_tags = [];
            for (let e of document.getElementsByClassName("tag-type-"+group)) group_tags.push(e.children[1].textContent);
            if (randomize) randomize_tags(group_tags);
            tags = tags.concat(group_tags);
        }
        return tags;
    }

    function get_dan_tags(randomize=false) {
        let tags = [];
        for (let group of tag_group_order) {
            group = ((group == "metadata") ? "meta" : group);
            let group_tags = [];
            for (let e of document.getElementsByClassName(group+"-tag-list")) {
                if (e.tagName != "UL") continue;
                for (let te of e.getElementsByClassName("search-tag")) group_tags.push(te.textContent);
            }
            if (randomize) randomize_tags(group_tags);
            tags = tags.concat(group_tags);
        }
        return tags;
    }

})();
