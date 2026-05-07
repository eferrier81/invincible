package com.invinciblegame.service;

import com.invinciblegame.domain.entity.CharacterCard;
import com.invinciblegame.domain.entity.User;
import com.invinciblegame.dto.response.PullResultResponse;
import com.invinciblegame.dto.response.PullStatusResponse;
import com.invinciblegame.exception.ApiException;
import com.invinciblegame.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PullService {
    private static final int WELCOME_COUNT = 3;
    private static final int DAILY_COUNT = 1;

    private final PackService packService;
    private final RewardService rewardService;
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final PullStatusService pullStatusService;

    public PullService(
        PackService packService,
        RewardService rewardService,
        CurrentUserService currentUserService,
        UserRepository userRepository,
        PullStatusService pullStatusService
    ) {
        this.packService = packService;
        this.rewardService = rewardService;
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.pullStatusService = pullStatusService;
    }

    public PullStatusResponse status() {
        User user = currentUserService.requireCurrentUser();
        return pullStatusService.buildStatus(user);
    }

    @Transactional
    public PullResultResponse welcomePull() {
        User user = currentUserService.requireCurrentUser();
        if (Boolean.TRUE.equals(user.getWelcomePullClaimed())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Welcome pull already claimed");
        }
        List<CharacterCard> pack = packService.generatePack(WELCOME_COUNT, false);
        grantPack(user, pack);
        user.setWelcomePullClaimed(true);
        userRepository.save(user);
        return new PullResultResponse(
            "WELCOME",
            pack.stream().map(c -> rewardService.toResponse(c, true)).toList(),
            pullStatusService.buildStatus(user)
        );
    }

    @Transactional
    public PullResultResponse dailyPull() {
        User user = currentUserService.requireCurrentUser();
        if (!pullStatusService.isDailyAvailable(user)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Daily pull already claimed today");
        }
        List<CharacterCard> pack = packService.generatePack(DAILY_COUNT, true);
        grantPack(user, pack);
        user.setLastDailyPullAt(LocalDateTime.now());
        userRepository.save(user);
        return new PullResultResponse(
            "DAILY",
            pack.stream().map(c -> rewardService.toResponse(c, true)).toList(),
            pullStatusService.buildStatus(user)
        );
    }

    private void grantPack(User user, List<CharacterCard> pack) {
        for (CharacterCard card : pack) {
            rewardService.grantCard(user, card);
        }
    }
}
