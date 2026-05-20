#!/bin/bash

# Script to merge main into every branch starting with "gen/" and push to origin

# Store current branch to return to it later
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Fetching latest changes from origin..."
git fetch origin

# Get list of local branches starting with "gen/"
# Also includes remote branches by creating them locally if they don't exist
BRANCHES=$(git branch -a | grep 'remotes/origin/gen/' | sed 's|.*remotes/origin/||')

if [ -z "$BRANCHES" ]; then
    echo "No branches starting with 'gen/' found."
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
        
        # Merge main into the current branch, favoring our changes in case of conflicts
        if git merge origin/main -X ours -m "Merge branch 'main' into $branch"; then
            echo "Successfully merged main into $branch (favored $branch in conflicts)"
            
            # Push the merge commit to origin
            if git push origin "$branch"; then
                echo "Successfully pushed $branch to origin"
            else
                echo "Error: Failed to push $branch to origin"
            fi
        else
            echo "Error: Merge conflict or failure on branch $branch. Aborting merge."
            git merge --abort
        fi
    else
        echo "Error: Failed to checkout $branch"
    fi
    echo "-----------------------------------"
done

# Return to the original branch
echo "Returning to branch: $CURRENT_BRANCH"
git checkout "$CURRENT_BRANCH"

echo "Done!"
