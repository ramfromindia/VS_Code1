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
output2 = document.getElementById("output2");

    // Main function to filter and render comments
    function renderFilteredComments(comments, bannedWord, containerId) {
      // Validate inputs
      if (
        !Array.isArray(comments) ||
        typeof bannedWord !== "string" ||
        bannedWord.trim() === "" ||
        typeof containerId !== "string" ||
        containerId.trim() === ""
      ) {
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = `Invalid inputs provided`;
        } else if (typeof console !== "undefined") {
          console.error("Invalid inputs provided");
        }
        return;
      }

      // Get container element
      const container = document.getElementById(containerId);
      if (!container) {
        output2.innerHTML = `Container element not found`;
        return;
      }

      // Clear existing content
      container.innerHTML = "";

      // Filter comments and transform text
      const filteredComments = filterComments(comments, bannedWord);

      // Create root <ul> and append to container
      const rootUl = document.createElement("ul");
      container.appendChild(rootUl);

      // Build DOM tree recursively
      buildCommentList(filteredComments, rootUl);

      // Add event delegation for toggling replies
      rootUl.addEventListener("click", (e) => {// Attach a click event listener to the rootUl element
        if (e.target.tagName === "LI") {// Check if the clicked element is a list item (LI)
          Array.from(e.target.children).forEach(child => {// Convert the HTMLCollection of e.target's children into an array,
// then iterate over each child element

            if (child.tagName === "UL") {// If the child is an unordered list (UL)
              child.classList.toggle("hidden");// Toggle the 'hidden' class to show/hide the nested list
            }
          });
        }
      });
    }

    // Helper function to filter comments recursively
    // Recursively filters out comments containing the banned word (case-insensitive)
    // and truncates the text to 50 characters, appending "..." if necessary.
    function filterComments(comments, bannedWord) {
      // Guard clause: if comments is not an array or is empty, return empty array
      if (!Array.isArray(comments) || comments.length === 0) {
        return [];
      }
      // Filter out comments whose text includes the banned word (case-insensitive)
      const filtered = comments
      .filter((comment) => { 
        // Convert both text and bannedWord to lowercase for case-insensitive comparison
        return !comment.text?.toLowerCase().includes(bannedWord.toLowerCase());
      })
      .map(comment => ({
        // Spread the original comment properties
        ...comment,
        // Truncate text to 50 characters and append "..." if needed
        text: comment.text?.length > 50 
        ? comment.text.slice(0, 50) + "..." 
        : comment.text,
        // Recursively filter replies if any exist, otherwise set to empty array
        replies: comment.replies?.length
        ? filterComments(comment.replies, bannedWord)
        : []
      }));
      // Return the filtered and transformed comments array
      return filtered;
    }

    // Helper function to build DOM tree recursively
    function buildCommentList(comments, parentUl) {
      const fragment = document.createDocumentFragment();
      comments.forEach((comment) => {
        // Create <li> for comment text
        const li = document.createElement("li");
        li.textContent = comment.text;

        // If replies exist, create nested <ul> and process recursively
        if (comment.replies?.length) {
          const nestedUl = document.createElement("ul");
          nestedUl.classList.add("hidden"); // Hide replies by default
          buildCommentList(comment.replies, nestedUl);
          li.appendChild(nestedUl);
        }
        fragment.appendChild(li);
      });
      parentUl.appendChild(fragment);
    }

    // Call the function to render comments
    renderFilteredComments(comments, "spam", "comments-container");
