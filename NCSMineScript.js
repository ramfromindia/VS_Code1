/*
      Question: Filtering and Transforming Nested Comments with DOM Interaction

      You are building a comment section for a blog where comments are stored in a nested array structure, representing parent and child comments. Each comment has a `text` property (a string) and a `replies` array (potentially containing nested comments). Your task is to write a JavaScript function that:
      1. Filters out comments containing a specific "banned" word (case-insensitive) from the nested comment array.
      2. Truncates the `text` of remaining comments to a maximum of 50 characters, appending "..." if truncated.
      3. Dynamically creates DOM elements to display the filtered and truncated comments in a nested `<ul>` structure on a webpage.

      Niche Scenario: The blog has a strict moderation policy where comments containing the word "spam" (case-insensitive) are removed. Additionally, the UI must reflect the hierarchy of replies, and clicking any comment `<li>` element toggles the visibility of its nested replies (if any) using DOM manipulation.

      Sample Data:
      const comments = [
        { text: "This is a great post about JavaScript!", replies: [
          { text: "Totally agree, but avoid spam comments.", replies: [] },
          { text: "Nice insights!", replies: [] }
        ]},
        { text: "Spam comments are annoying and should be banned.", replies: [
          { text: "SPAM posts ruin the experience.", replies: [] }
        ]},
        { text: "Very informative article with great details on arrays and strings.", replies: [] }
      ];

      Requirements:
      - Write a function `renderFilteredComments(comments, bannedWord, containerId)` that:
        - Filters out comments (and their replies) containing the `bannedWord` (case-insensitive).
        - Truncates comment text to 50 characters, appending "..." if necessary.
        - Creates a nested `<ul>` structure in the DOM element with the given `containerId`.
        - Adds a click event listener to each `<li>` to toggle the visibility of its nested `<ul>` (replies).
      - Ensure the solution handles nested replies of arbitrary depth.
      - Use only vanilla JavaScript (no frameworks).

      Constraints:
      - The `text` property is always a string, but `replies` may be empty.
      - The banned word search should be case-insensitive.
      - The DOM structure must be created dynamically, and event listeners must be attached to each `<li>`.
    */

    // Sample comment data
    const comments = [
      {
        text: "This is a great post about JavaScript!",
        replies: [
          { text: "Totally agree, but avoid spam comments.", replies: [] },
          { text: "Nice insights!", replies: [] }
        ]
      },
      {
        text: "Spam comments are annoying and should be banned.",
        replies: [
          { text: "SPAM posts ruin the experience.", replies: [] }
        ]
      },
      {
        text: "Very informative article with great details on arrays and strings.",
        replies: []
      }
    ];
    output1 = document.querySelector("#output1");
    output2 = document.querySelector("#output2");
    output3 = document.querySelector("#output3");
/**
 * Renders filtered comments into a container, excluding those containing a banned word.
 * @param {Array<string>} comments - Array of comment strings.
 * @param {string} bannedWord - Word to filter out (case-insensitive).
 * @param {string} containerId - ID of the container element to render into.
 */
function renderFilteredComments(comments, bannedWord, containerId) {
  // Input validation
  if (!Array.isArray(comments) || comments.length === 0) {
    const el = document.getElementById(containerId) || output1;
    if (el) el.textContent = "Comments array is empty or not provided.";
    return;
  }
  if (typeof bannedWord !== "string" || bannedWord.trim() === "") {
    const el = document.getElementById(containerId) || output2;
    if (el) el.textContent = "Banned word is empty or not provided.";
    return;
  }
  if (typeof containerId !== "string" || containerId.trim() === "") {
    if (output3) output3.textContent = "Container ID is not provided.";
    return;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    if (output3) output3.textContent = `No element found with ID: ${containerId}`;
    return;
  }

  // Helper: Recursively filter comments, truncate text, and process replies
  function processComments(commentsArr) {
    return commentsArr
      .filter(comment => !comment.text.toLowerCase().includes(bannedWord.toLowerCase()))
      .map(comment => {
        // Truncate text to 50 chars if needed
        return {
          text: comment.text.length > 50 ? comment.text.slice(0, 50) + "..." : comment.text,
          replies: processComments(comment.replies || [])
        };
      });
  }

  // Helper: Recursively create nested <ul> structure
  function createList(commentsArr) {
    // Recursively create a nested <ul> for comments and replies
    if (!commentsArr.length) return null;
    const ul = document.createElement('ul'); // Create a new <ul> element
    const fragment = document.createDocumentFragment(); // Use fragment to minimize DOM reflows
    commentsArr.forEach(comment => {
      const li = document.createElement('li'); // Create a <li> for each comment
      li.textContent = comment.text; // Already truncated in processComments
      if (comment.replies?.length) {
        const repliesUl = createList(comment.replies); // Recursively create replies list
        if (repliesUl) {
          repliesUl.classList.add('hidden'); // Hide replies by default
          li.appendChild(repliesUl); // Append replies <ul> to <li>
          li.style.cursor = 'pointer'; // Indicate clickable for toggling
        }
      }
      fragment.appendChild(li); // Add <li> to fragment
    });
    ul.appendChild(fragment); // Append all <li> to <ul> at once
    // Event delegation: toggle replies when a <li> with nested <ul> is clicked
    ul.addEventListener('click', function(e) {
      const li = e.target.closest('li'); // Find the clicked <li>
      if (!li || !ul.contains(li)) return; // Ensure <li> is within this <ul>
      const nestedUl = li.querySelector(':scope > ul'); // Find direct child <ul> (replies)
      if (nestedUl) {
        nestedUl.classList.toggle('hidden'); // Toggle visibility of replies
        e.stopPropagation(); // Prevent event from bubbling up
      }
    });
    return ul; // Return the constructed <ul>
  }

  // Filter, truncate, and render
  const processed = processComments(comments);
  container.innerHTML = '';
  const list = createList(processed);
  if (list) container.appendChild(list);
}
renderFilteredComments(comments, "spam", "comments-container");