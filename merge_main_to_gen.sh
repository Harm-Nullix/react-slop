#!/bin/bash

# Script to merge main into every branch starting with "gen/" and push to origin

# Store current branch to return to it later
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Stash any local changes to avoid conflicts during checkout/pull
HAS_STASHED=false
if ! git diff-index --quiet HEAD --; then
    echo "Stashing local changes..."
    git stash push -m "Auto-stash before merge_main_to_gen.sh"
    HAS_STASHED=true
fi

echo "Fetching latest changes from origin..."
git fetch origin

# Get list of local branches starting with "gen/" or "gh-pages"
# Also includes remote branches by creating them locally if they don't exist
BRANCHES=$(git branch -a | grep -E 'remotes/origin/gen/|remotes/origin/gh-pages' | sed 's|.*remotes/origin/||')

if [ -z "$BRANCHES" ]; then
    echo "No matching branches found."
    exit 0
fi

echo "Found branches:"
echo "$BRANCHES"
echo "-----------------------------------"

for branch in $BRANCHES; do
    echo "Processing branch: $branch"
    
    # Checkout the branch (creating it from remote if necessary)
    if git checkout "$branch"; then
        echo "Successfully checked out $branch"
        
        # Ensure the local branch is up to date with origin
        echo "Updating $branch from origin..."
        if git pull origin "$branch" --rebase; then
             echo "Local branch $branch is now up to date"
        else
             echo "Warning: Failed to pull $branch. Attempting to continue anyway..."
        fi
        
        # Attempt to merge main into the current branch
        if git merge origin/main -m "Merge branch 'main' into $branch"; then
            echo "Successfully merged main into $branch"
        else
            echo "Merge conflict detected on $branch. Resolving according to rules..."
            
            # 1. Resolve src/App.tsx using "ours" (the target branch)
            if git status --short | grep -q "src/App.tsx"; then
                echo "Resolving src/App.tsx using target branch version"
                git checkout --ours src/App.tsx
                git add src/App.tsx
            fi
            
            # 2. Resolve index.html using "ours" ONLY if branch is gh-pages
            if [ "$branch" == "gh-pages" ] && git status --short | grep -q "index.html"; then
                echo "Resolving index.html using target branch version (gh-pages)"
                git checkout --ours index.html
                git add index.html
            fi
            
            # 3. Resolve everything else using "theirs" (the main branch)
            # Find all remaining unmerged files
            UNMERGED=$(git diff --name-only --diff-filter=U)
            if [ -n "$UNMERGED" ]; then
                echo "Resolving remaining conflicts using main branch version: $UNMERGED"
                git checkout --theirs $UNMERGED
                git add $UNMERGED
            fi
            
            # 3. Finalize the merge
            if git commit -m "Merge branch 'main' into $branch (with custom conflict resolution)"; then
                echo "Successfully resolved conflicts and merged main into $branch"
            else
                echo "Error: Failed to commit merge for $branch. Aborting."
                git merge --abort
                continue
            fi
        fi
        
        # Push the merge commit to origin
        if git push origin "$branch"; then
            echo "Successfully pushed $branch to origin"
        else
            echo "Error: Failed to push $branch to origin"
        fi
    else
        echo "Error: Failed to checkout $branch"
    fi
    echo "-----------------------------------"
done

# Return to the original branch
echo "Returning to branch: $CURRENT_BRANCH"
git checkout "$CURRENT_BRANCH"

# Restore stashed changes if any
if [ "$HAS_STASHED" = true ]; then
    echo "Restoring stashed changes..."
    git stash pop
fi

echo "Done!"
